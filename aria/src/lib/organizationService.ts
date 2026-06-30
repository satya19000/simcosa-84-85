import { httpsCallable } from 'firebase/functions'
import { functions as fns } from './firebase'

const createOrganizationFn = httpsCallable(fns, 'createOrganization')
const getOrganizationFn = httpsCallable(fns, 'getOrganization')
const updateOrganizationFn = httpsCallable(fns, 'updateOrganization')
const listMyOrganizationsFn = httpsCallable(fns, 'listMyOrganizations')
const createWorkspaceFn = httpsCallable(fns, 'createWorkspace')
const getWorkspaceFn = httpsCallable(fns, 'getWorkspace')
const listWorkspacesFn = httpsCallable(fns, 'listWorkspaces')
const listMembersFn = httpsCallable(fns, 'listMembers')
const removeMemberFn = httpsCallable(fns, 'removeMember')
const changeMemberRoleFn = httpsCallable(fns, 'changeMemberRole')
const inviteMemberFn = httpsCallable(fns, 'inviteMember')
const listInvitationsFn = httpsCallable(fns, 'listInvitations')
const acceptInvitationFn = httpsCallable(fns, 'acceptInvitation')
const revokeInvitationFn = httpsCallable(fns, 'revokeInvitation')
const listActivityFn = httpsCallable(fns, 'listActivity')
const postAnnouncementFn = httpsCallable(fns, 'postAnnouncement')
const assignMissionToWorkspaceFn = httpsCallable(fns, 'assignMissionToWorkspace')
const listSharedMissionsFn = httpsCallable(fns, 'listSharedMissions')
const delegateTaskFn = httpsCallable(fns, 'delegateTask')
const listSharedTasksFn = httpsCallable(fns, 'listSharedTasks')
const requestSharedApprovalFn = httpsCallable(fns, 'requestSharedApproval')
const getSharedTaskApprovalStatusFn = httpsCallable(fns, 'getSharedTaskApprovalStatus')
const getOrganizationAnalyticsFn = httpsCallable(fns, 'getOrganizationAnalytics')

export type OrganizationType =
  | 'personal' | 'team' | 'department' | 'hospital' | 'government_office' | 'enterprise'

export type MemberRole =
  | 'owner' | 'admin' | 'manager' | 'supervisor' | 'staff' | 'guest' | 'viewer'

export const MEMBER_ROLES: MemberRole[] = ['owner', 'admin', 'manager', 'supervisor', 'staff', 'guest', 'viewer']

export type MemberStatus = 'active' | 'suspended' | 'removed'
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired'

export interface OrganizationRecord {
  id: string
  organizationId: string
  name: string
  type: OrganizationType
  description: string
  ownerId: string
  createdBy: string
  createdAt: string
  updatedAt: string
  settings: { allowGuestInvites: boolean; defaultMemberRole: MemberRole }
}

export interface WorkspaceRecord {
  id: string
  organizationId: string
  workspaceId: string
  name: string
  description: string
  managerIds: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
  archived: boolean
}

export interface MemberRecord {
  id: string
  organizationId: string
  memberId: string
  userId: string
  displayName: string
  email: string
  role: MemberRole
  workspaceIds: string[]
  status: MemberStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  joinedAt: string | null
}

export interface InvitationRecord {
  id: string
  organizationId: string
  invitationId: string
  email: string
  role: MemberRole
  workspaceId: string | null
  status: InvitationStatus
  invitedBy: string
  createdBy: string
  createdAt: string
  updatedAt: string
  expiresAt: string
  acceptedBy: string | null
  acceptedAt: string | null
}

export interface ActivityRecord {
  id: string
  organizationId: string
  activityId: string
  type: string
  actorId: string
  summary: string
  workspaceId: string | null
  targetId: string | null
  metadata: Record<string, unknown>
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface SharedMissionRecord {
  id: string
  organizationId: string
  missionId: string
  workspaceId: string
  underlyingMissionId: string
  assignedMemberIds: string[]
  status: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface SharedTaskRecord {
  id: string
  organizationId: string
  taskId: string
  workspaceId: string
  title: string
  description: string
  assignedTo: string | null
  delegatedBy: string
  status: 'open' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'
  approvalRequestId: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface OrganizationAnalyticsSnapshot {
  organizationId: string
  memberCount: number
  workspaceCount: number
  sharedMissionCount: number
  pendingApprovalCount: number
  completedMissionCount: number
  activityVolume: number
  computedAt: string
}

// ── Organizations ────────────────────────────────────────────────────────────

export async function createOrganization(input: { name: string; type: OrganizationType; description?: string }): Promise<OrganizationRecord> {
  const result = await createOrganizationFn(input)
  return result.data as OrganizationRecord
}

export async function getOrganization(organizationId: string): Promise<OrganizationRecord | null> {
  const result = await getOrganizationFn({ organizationId })
  return result.data as OrganizationRecord | null
}

export async function updateOrganization(organizationId: string, fields: Partial<{ name: string; description: string; type: OrganizationType }>): Promise<OrganizationRecord | null> {
  const result = await updateOrganizationFn({ organizationId, ...fields })
  return result.data as OrganizationRecord | null
}

export async function listMyOrganizations(candidateOrganizationIds: string[]): Promise<OrganizationRecord[]> {
  const result = await listMyOrganizationsFn({ candidateOrganizationIds })
  return result.data as OrganizationRecord[]
}

// ── Workspaces ───────────────────────────────────────────────────────────────

export async function createWorkspace(organizationId: string, name: string, description?: string): Promise<WorkspaceRecord> {
  const result = await createWorkspaceFn({ organizationId, name, description })
  return result.data as WorkspaceRecord
}

export async function getWorkspace(organizationId: string, workspaceId: string): Promise<WorkspaceRecord | null> {
  const result = await getWorkspaceFn({ organizationId, workspaceId })
  return result.data as WorkspaceRecord | null
}

export async function listWorkspaces(organizationId: string): Promise<WorkspaceRecord[]> {
  const result = await listWorkspacesFn({ organizationId })
  return result.data as WorkspaceRecord[]
}

// ── Members ──────────────────────────────────────────────────────────────────

export async function listMembers(organizationId: string): Promise<MemberRecord[]> {
  const result = await listMembersFn({ organizationId })
  return result.data as MemberRecord[]
}

export async function removeMember(organizationId: string, memberId: string): Promise<MemberRecord | null> {
  const result = await removeMemberFn({ organizationId, memberId })
  return result.data as MemberRecord | null
}

export async function changeMemberRole(organizationId: string, memberId: string, role: MemberRole): Promise<MemberRecord | null> {
  const result = await changeMemberRoleFn({ organizationId, memberId, role })
  return result.data as MemberRecord | null
}

// ── Invitations ──────────────────────────────────────────────────────────────

export async function inviteMember(organizationId: string, email: string, role: MemberRole, workspaceId?: string): Promise<InvitationRecord> {
  const result = await inviteMemberFn({ organizationId, email, role, workspaceId })
  return result.data as InvitationRecord
}

export async function listInvitations(organizationId: string): Promise<InvitationRecord[]> {
  const result = await listInvitationsFn({ organizationId })
  return result.data as InvitationRecord[]
}

export async function acceptInvitation(organizationId: string, invitationId: string): Promise<MemberRecord> {
  const result = await acceptInvitationFn({ organizationId, invitationId })
  return result.data as MemberRecord
}

export async function revokeInvitation(organizationId: string, invitationId: string): Promise<InvitationRecord | null> {
  const result = await revokeInvitationFn({ organizationId, invitationId })
  return result.data as InvitationRecord | null
}

// ── Activity / Announcements ────────────────────────────────────────────────

export async function listActivity(organizationId: string, workspaceId?: string): Promise<ActivityRecord[]> {
  const result = await listActivityFn({ organizationId, workspaceId })
  return result.data as ActivityRecord[]
}

export async function postAnnouncement(organizationId: string, title: string, body: string, workspaceId?: string): Promise<ActivityRecord> {
  const result = await postAnnouncementFn({ organizationId, title, body, workspaceId })
  return result.data as ActivityRecord
}

// ── Mission Control integration ─────────────────────────────────────────────

export async function assignMissionToWorkspace(organizationId: string, workspaceId: string, missionId: string, assignedMemberIds: string[]): Promise<SharedMissionRecord> {
  const result = await assignMissionToWorkspaceFn({ organizationId, workspaceId, missionId, assignedMemberIds })
  return result.data as SharedMissionRecord
}

export async function listSharedMissions(organizationId: string, workspaceId?: string): Promise<SharedMissionRecord[]> {
  const result = await listSharedMissionsFn({ organizationId, workspaceId })
  return result.data as SharedMissionRecord[]
}

// ── Team delegation (shared tasks) ──────────────────────────────────────────

export async function delegateTask(organizationId: string, workspaceId: string, title: string, description?: string, assignedTo?: string): Promise<SharedTaskRecord> {
  const result = await delegateTaskFn({ organizationId, workspaceId, title, description, assignedTo })
  return result.data as SharedTaskRecord
}

export async function listSharedTasks(organizationId: string, workspaceId?: string): Promise<SharedTaskRecord[]> {
  const result = await listSharedTasksFn({ organizationId, workspaceId })
  return result.data as SharedTaskRecord[]
}

// ── Shared approvals (routed through the real Approval Engine only) ────────

export async function requestSharedApproval(input: {
  organizationId: string; taskId: string
  title: string; summary: string; reason: string
  triggerType: string; actions: { id: string; description: string; target?: string; payload?: Record<string, unknown> }[]
  rollbackPlan: string; estimatedDurationMs?: number
  riskFactors: { externalCommunication: boolean; financialImpact: number; healthImpact: boolean; privacyImpact: boolean; irreversible: boolean; aiConfidence: number }
  expiresInMs?: number
}): Promise<unknown> {
  const result = await requestSharedApprovalFn(input)
  return result.data
}

export async function getSharedTaskApprovalStatus(organizationId: string, taskId: string): Promise<unknown> {
  const result = await getSharedTaskApprovalStatusFn({ organizationId, taskId })
  return result.data
}

// ── Analytics ────────────────────────────────────────────────────────────────

export async function getOrganizationAnalytics(organizationId: string): Promise<OrganizationAnalyticsSnapshot> {
  const result = await getOrganizationAnalyticsFn({ organizationId })
  return result.data as OrganizationAnalyticsSnapshot
}
