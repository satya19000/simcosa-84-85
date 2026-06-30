import { useState } from 'react'
import { UserMinus, Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { MEMBER_ROLES, type MemberRecord, type MemberRole } from '@/lib/organizationService'

interface Props {
  members: MemberRecord[]
  canManage: boolean
  onRemove: (memberId: string) => void | Promise<void>
  onChangeRole: (memberId: string, role: MemberRole) => void | Promise<void>
}

export function MemberList({ members, canManage, onRemove, onChangeRole }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleRemove(memberId: string) {
    setBusyId(memberId)
    try { await onRemove(memberId) } finally { setBusyId(null) }
  }

  async function handleRoleChange(memberId: string, role: MemberRole) {
    setBusyId(memberId)
    try { await onChangeRole(memberId, role) } finally { setBusyId(null) }
  }

  if (members.length === 0) {
    return <p className="text-sm text-white/30 text-center py-8">No members yet</p>
  }

  return (
    <div className="space-y-2">
      {members.map((m) => (
        <Card key={m.memberId} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {m.displayName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{m.displayName}</p>
            <p className="text-xs text-white/40 truncate">{m.email}</p>
          </div>
          {canManage ? (
            <select
              value={m.role}
              disabled={busyId === m.memberId || m.role === 'owner'}
              onChange={(e) => void handleRoleChange(m.memberId, e.target.value as MemberRole)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 capitalize disabled:opacity-50"
            >
              {MEMBER_ROLES.map((r) => (
                <option key={r} value={r} className="bg-[#0A0E27] capitalize">{r}</option>
              ))}
            </select>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-white/40 capitalize">
              <Shield className="w-3 h-3" />{m.role}
            </span>
          )}
          {canManage && m.role !== 'owner' && (
            <button
              onClick={() => void handleRemove(m.memberId)}
              disabled={busyId === m.memberId}
              className="text-red-400/70 hover:text-red-400 disabled:opacity-50 flex-shrink-0"
            >
              <UserMinus className="w-4 h-4" />
            </button>
          )}
        </Card>
      ))}
    </div>
  )
}
