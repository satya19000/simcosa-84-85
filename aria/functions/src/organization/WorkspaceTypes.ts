// ── Workspace / Organization shared types ──────────────────────────────────────

export type OrganizationType =
  | 'personal' | 'team' | 'department' | 'hospital' | 'government_office' | 'enterprise'

export type MemberRole =
  | 'owner' | 'admin' | 'manager' | 'supervisor' | 'staff' | 'guest' | 'viewer'

/** Centralized ordering, lowest to highest privilege. Single source of truth — see WorkspacePermissions.ts */
export const ROLE_ORDER: MemberRole[] = ['viewer', 'guest', 'staff', 'supervisor', 'manager', 'admin', 'owner']

export type MemberStatus = 'active' | 'suspended' | 'removed'

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired'

export type ActivityEventType =
  | 'organization_created'
  | 'workspace_created'
  | 'member_invited'
  | 'member_joined'
  | 'member_removed'
  | 'member_role_changed'
  | 'mission_assigned'
  | 'task_delegated'
  | 'approval_requested'
  | 'announcement_posted'
  | 'comment_posted'
  | 'mention_created'

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
  settings: {
    allowGuestInvites: boolean
    defaultMemberRole: MemberRole
  }
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
  type: ActivityEventType
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

export interface SharedDocumentRecord {
  id: string
  organizationId: string
  documentId: string
  workspaceId: string
  title: string
  url: string | null
  sharedBy: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface AnnouncementRecord {
  id: string
  organizationId: string
  announcementId: string
  workspaceId: string | null
  title: string
  body: string
  postedBy: string
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
