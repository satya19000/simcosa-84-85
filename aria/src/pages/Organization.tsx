import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Building2, UserPlus, Users, Activity as ActivityIcon, Layers } from 'lucide-react'
import { Skeleton } from '@/components/ui/LoadingSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { WorkspaceCard } from '@/components/organization/WorkspaceCard'
import { MemberList } from '@/components/organization/MemberList'
import { InvitationList } from '@/components/organization/InvitationList'
import { ActivityFeed } from '@/components/organization/ActivityFeed'
import { CreateOrganizationModal } from '@/components/organization/CreateOrganizationModal'
import { CreateWorkspaceModal } from '@/components/organization/CreateWorkspaceModal'
import { InviteMemberModal } from '@/components/organization/InviteMemberModal'
import {
  listMyOrganizations, getOrganization, listWorkspaces, listMembers, listInvitations, listActivity,
  removeMember, changeMemberRole, revokeInvitation,
  type OrganizationRecord, type WorkspaceRecord, type MemberRecord, type InvitationRecord, type ActivityRecord, type MemberRole,
} from '@/lib/organizationService'
import { useAuthStore } from '@/store/authStore'

type Tab = 'workspaces' | 'members' | 'invitations' | 'activity'

const TABS: { value: Tab; label: string; icon: typeof Layers }[] = [
  { value: 'workspaces', label: 'Workspaces', icon: Layers },
  { value: 'members', label: 'Members', icon: Users },
  { value: 'invitations', label: 'Invites', icon: UserPlus },
  { value: 'activity', label: 'Activity', icon: ActivityIcon },
]

const ORG_IDS_KEY = 'aria_organization_ids'

function getStoredOrgIds(): string[] {
  try { return JSON.parse(localStorage.getItem(ORG_IDS_KEY) ?? '[]') } catch { return [] }
}

function storeOrgId(id: string) {
  try {
    const ids = new Set(getStoredOrgIds())
    ids.add(id)
    localStorage.setItem(ORG_IDS_KEY, JSON.stringify([...ids]))
  } catch { /* ignore */ }
}

export default function Organization() {
  const { organizationId } = useParams<{ organizationId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([])
  const [current, setCurrent] = useState<OrganizationRecord | null>(null)
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([])
  const [members, setMembers] = useState<MemberRecord[]>([])
  const [invitations, setInvitations] = useState<InvitationRecord[]>([])
  const [activity, setActivity] = useState<ActivityRecord[]>([])
  const [tab, setTab] = useState<Tab>('workspaces')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  const myMembership = members.find((m) => m.userId === user?.uid)
  const canManage = myMembership ? ['owner', 'admin', 'manager'].includes(myMembership.role) : false

  const loadOrgList = useCallback(async () => {
    const ids = getStoredOrgIds()
    const orgs = await listMyOrganizations(ids)
    setOrganizations(orgs)
    return orgs
  }, [])

  const loadOrgDetail = useCallback(async (id: string) => {
    const [org, ws, mem, inv, act] = await Promise.all([
      getOrganization(id),
      listWorkspaces(id),
      listMembers(id),
      listInvitations(id).catch(() => []),
      listActivity(id).catch(() => []),
    ])
    setCurrent(org)
    setWorkspaces(ws)
    setMembers(mem)
    setInvitations(inv)
    setActivity(act)
  }, [])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        if (organizationId) {
          storeOrgId(organizationId)
          await loadOrgDetail(organizationId)
        } else {
          await loadOrgList()
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
  }, [organizationId, user, loadOrgDetail, loadOrgList])

  function handleOrgCreated(newOrgId: string) {
    storeOrgId(newOrgId)
    navigate(`/organization/${newOrgId}`)
  }

  async function handleRemoveMember(memberId: string) {
    if (!organizationId) return
    await removeMember(organizationId, memberId)
    await loadOrgDetail(organizationId)
  }

  async function handleChangeRole(memberId: string, role: MemberRole) {
    if (!organizationId) return
    await changeMemberRole(organizationId, memberId, role)
    await loadOrgDetail(organizationId)
  }

  async function handleRevokeInvitation(invitationId: string) {
    if (!organizationId) return
    await revokeInvitation(organizationId, invitationId)
    await loadOrgDetail(organizationId)
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-4 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />
  }

  // ── Organization list (no :organizationId in URL) ──────────────────────────
  if (!organizationId) {
    return (
      <div className="px-4 pt-6 pb-4 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Organizations</h1>
          <Button size="sm" onClick={() => setShowCreateOrg(true)}>
            <Plus className="w-4 h-4" /> New
          </Button>
        </div>

        {organizations.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No organizations yet"
            description="Create an organization to start collaborating with your team."
            action={{ label: 'Create Organization', onClick: () => setShowCreateOrg(true) }}
          />
        ) : (
          <div className="space-y-2">
            {organizations.map((org) => (
              <motion.div key={org.organizationId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <button onClick={() => navigate(`/organization/${org.organizationId}`)} className="w-full text-left">
                  <Card className="flex items-center gap-3 hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-[#7C3AED]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{org.name}</p>
                      <p className="text-xs text-white/40 capitalize">{org.type.replace('_', ' ')}</p>
                    </div>
                  </Card>
                </button>
              </motion.div>
            ))}
          </div>
        )}

        <CreateOrganizationModal open={showCreateOrg} onClose={() => setShowCreateOrg(false)} onCreated={handleOrgCreated} />
      </div>
    )
  }

  // ── Organization detail ─────────────────────────────────────────────────────
  if (!current) {
    return (
      <EmptyState
        icon={Building2}
        title="Organization not found"
        description="You may not have access to this organization, or it doesn't exist."
        action={{ label: 'Back to Organizations', onClick: () => navigate('/organization') }}
      />
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">{current.name}</h1>
          <p className="text-xs text-white/40 capitalize">{current.type.replace('_', ' ')}</p>
        </div>
      </div>

      {current.description && <p className="text-sm text-white/60">{current.description}</p>}

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              tab === value ? 'bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30' : 'bg-white/5 text-white/50 border border-white/10'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {tab === 'workspaces' && (
        <div className="space-y-3">
          {canManage && (
            <Button size="sm" variant="secondary" onClick={() => setShowCreateWorkspace(true)} className="w-full">
              <Plus className="w-4 h-4" /> New Workspace
            </Button>
          )}
          {workspaces.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8">No workspaces yet</p>
          ) : (
            <div className="space-y-2">
              {workspaces.map((ws) => (
                <WorkspaceCard
                  key={ws.workspaceId}
                  workspace={ws}
                  onClick={() => navigate(`/organization/${organizationId}/workspace/${ws.workspaceId}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-3">
          {canManage && (
            <Button size="sm" variant="secondary" onClick={() => setShowInvite(true)} className="w-full">
              <UserPlus className="w-4 h-4" /> Invite Member
            </Button>
          )}
          <MemberList members={members} canManage={canManage} onRemove={handleRemoveMember} onChangeRole={handleChangeRole} />
        </div>
      )}

      {tab === 'invitations' && (
        <InvitationList invitations={invitations} canManage={canManage} onRevoke={handleRevokeInvitation} />
      )}

      {tab === 'activity' && <ActivityFeed activity={activity} />}

      <CreateWorkspaceModal
        open={showCreateWorkspace}
        organizationId={organizationId}
        onClose={() => setShowCreateWorkspace(false)}
        onCreated={() => void loadOrgDetail(organizationId)}
      />
      <InviteMemberModal
        open={showInvite}
        organizationId={organizationId}
        onClose={() => setShowInvite(false)}
        onInvited={() => void loadOrgDetail(organizationId)}
      />
    </div>
  )
}
