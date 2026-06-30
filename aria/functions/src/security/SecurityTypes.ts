// ── Identity model ───────────────────────────────────────────────────────────

export type IdentityType =
  | 'personal_user' | 'organization_member' | 'guest' | 'service_account' | 'bot_account' | 'super_admin'

export type IdentityStatus = 'active' | 'suspended' | 'revoked'

export interface IdentityRecord {
  id: string
  tenantId: string
  identityId: string
  userId: string | null
  organizationId: string | null
  workspaceId: string | null
  type: IdentityType
  status: IdentityStatus
  roles: string[]
  permissions: PermissionAction[]
  displayName: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ── Tenant model ─────────────────────────────────────────────────────────────

export type TenantType = 'personal' | 'organization' | 'enterprise' | 'government' | 'healthcare' | 'education'
export type TenantStatus = 'active' | 'suspended' | 'archived'
export type TenantPlan = 'free' | 'starter' | 'team' | 'enterprise'

export interface TenantRecord {
  id: string
  tenantId: string
  tenantType: TenantType
  organizationId: string | null
  ownerId: string
  status: TenantStatus
  plan: TenantPlan
  name: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ── RBAC ──────────────────────────────────────────────────────────────────────

/** Closed vocabulary of actions. RBACEngine/PermissionManager are the only places this is interpreted. */
export type PermissionAction =
  | 'organization.read' | 'organization.manage'
  | 'workspace.read' | 'workspace.manage'
  | 'members.invite' | 'members.remove'
  | 'tasks.read' | 'tasks.write'
  | 'missions.read' | 'missions.write'
  | 'approvals.read' | 'approvals.approve'
  | 'documents.read' | 'documents.write'
  | 'plugins.install'
  | 'security.manage'
  | 'audit.read'
  | 'billing.manage'

export const PERMISSION_ACTIONS: PermissionAction[] = [
  'organization.read', 'organization.manage',
  'workspace.read', 'workspace.manage',
  'members.invite', 'members.remove',
  'tasks.read', 'tasks.write',
  'missions.read', 'missions.write',
  'approvals.read', 'approvals.approve',
  'documents.read', 'documents.write',
  'plugins.install',
  'security.manage',
  'audit.read',
  'billing.manage',
]

export type RoleScope = 'tenant' | 'organization' | 'workspace'

export interface RoleRecord {
  id: string
  tenantId: string
  roleId: string
  name: string
  scope: RoleScope
  permissions: PermissionAction[]
  /** roleId of a role this role inherits permissions from, if any. */
  inheritsFrom: string | null
  isSystem: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface RoleAssignmentRecord {
  id: string
  tenantId: string
  assignmentId: string
  identityId: string
  roleId: string
  scope: RoleScope
  scopeId: string | null
  /** If set, the role is temporary and expires at this ISO timestamp. */
  expiresAt: string | null
  /** If set, this assignment was delegated by another identity (delegated role). */
  delegatedBy: string | null
  createdBy: string
  createdAt: string
}

export type PolicyResult = 'allow' | 'deny' | 'requireApproval' | 'requireElevatedRole' | 'auditOnly'

export interface PolicyRecord {
  id: string
  tenantId: string
  policyId: string
  name: string
  description: string
  /** Action this policy governs, e.g. 'plugins.install', 'documents.write'. */
  action: PermissionAction
  result: PolicyResult
  /** Required role name when result === 'requireElevatedRole'. */
  requiredRole: string | null
  enabled: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface PolicyEvaluation {
  result: PolicyResult
  policyId: string | null
  reason: string
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export interface SessionRecord {
  id: string
  tenantId: string
  sessionId: string
  identityId: string
  userId: string
  loginAt: string
  lastActiveAt: string
  deviceInfo: string | null
  browser: string | null
  /** PLACEHOLDER ONLY — not real IP geolocation. Field reserved for future wiring. */
  ipAddress: string | null
  /** PLACEHOLDER ONLY — not real geolocation. Field reserved for future wiring. */
  location: string | null
  active: boolean
  revokedAt: string | null
  createdAt: string
}

// ── Groups ────────────────────────────────────────────────────────────────────

export interface GroupRecord {
  id: string
  tenantId: string
  groupId: string
  name: string
  description: string
  memberIdentityIds: string[]
  roleIds: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ── Audit ─────────────────────────────────────────────────────────────────────

export type AuditRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface SecurityAuditRecord {
  id: string
  tenantId: string
  eventId: string
  actorId: string
  organizationId: string | null
  workspaceId: string | null
  action: string
  resource: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  timestamp: string
  riskLevel: AuditRiskLevel
  traceId: string | null
}

// ── User Directory ────────────────────────────────────────────────────────────

export interface ServiceAccountRecord {
  id: string
  tenantId: string
  serviceAccountId: string
  identityId: string
  name: string
  description: string
  createdBy: string
  createdAt: string
  updatedAt: string
  revoked: boolean
}

export interface DirectoryView {
  tenantId: string
  organizationId: string | null
  memberCount: number
  groupCount: number
  serviceAccountCount: number
  roleCount: number
  pendingInvitationCount: number
}
