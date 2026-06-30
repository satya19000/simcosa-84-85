import { httpsCallable } from 'firebase/functions'
import { functions as fns } from './firebase'

const createTenantFn = httpsCallable(fns, 'createTenant')
const getTenantFn = httpsCallable(fns, 'getTenant')
const listMyTenantsFn = httpsCallable(fns, 'listMyTenants')
const createIdentityFn = httpsCallable(fns, 'createIdentity')
const listIdentitiesFn = httpsCallable(fns, 'listIdentities')
const checkPermissionFn = httpsCallable(fns, 'checkPermission')
const createRoleFn = httpsCallable(fns, 'createRole')
const listRolesFn = httpsCallable(fns, 'listRoles')
const assignRoleFn = httpsCallable(fns, 'assignRole')
const revokeRoleAssignmentFn = httpsCallable(fns, 'revokeRoleAssignment')
const createPolicyFn = httpsCallable(fns, 'createPolicy')
const updatePolicyFn = httpsCallable(fns, 'updatePolicy')
const listPoliciesFn = httpsCallable(fns, 'listPolicies')
const evaluatePolicyFn = httpsCallable(fns, 'evaluatePolicy')
const createSessionFn = httpsCallable(fns, 'createSession')
const refreshSessionFn = httpsCallable(fns, 'refreshSession')
const revokeSessionFn = httpsCallable(fns, 'revokeSession')
const listSessionsFn = httpsCallable(fns, 'listSessions')
const createGroupFn = httpsCallable(fns, 'createGroup')
const listGroupsFn = httpsCallable(fns, 'listGroups')
const addGroupMemberFn = httpsCallable(fns, 'addGroupMember')
const removeGroupMemberFn = httpsCallable(fns, 'removeGroupMember')
const assignRoleToGroupFn = httpsCallable(fns, 'assignRoleToGroup')
const createServiceAccountFn = httpsCallable(fns, 'createServiceAccount')
const listServiceAccountsFn = httpsCallable(fns, 'listServiceAccounts')
const getDirectoryViewFn = httpsCallable(fns, 'getDirectoryView')
const listAuditEventsFn = httpsCallable(fns, 'listAuditEvents')
const getSecurityAnalyticsFn = httpsCallable(fns, 'getSecurityAnalytics')

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
  expiresAt: string | null
  delegatedBy: string | null
  createdBy: string
  createdAt: string
}

export type PolicyResult = 'allow' | 'deny' | 'requireApproval' | 'requireElevatedRole' | 'auditOnly'

export const POLICY_RESULTS: PolicyResult[] = ['allow', 'deny', 'requireApproval', 'requireElevatedRole', 'auditOnly']

export interface PolicyRecord {
  id: string
  tenantId: string
  policyId: string
  name: string
  description: string
  action: PermissionAction
  result: PolicyResult
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
  /** PLACEHOLDER ONLY — not real IP geolocation. */
  ipAddress: string | null
  /** PLACEHOLDER ONLY — not real geolocation. */
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

export interface SecurityAnalyticsSnapshot {
  tenantId: string
  identityCount: number
  activeSessionCount: number
  roleCount: number
  policyCount: number
  recentAuditEventCount: number
  highRiskAuditEventCount: number
  computedAt: string
}

// ── Tenants ────────────────────────────────────────────────────────────────────

export async function createTenant(input: { name: string; tenantType: TenantType; organizationId?: string; plan?: TenantPlan }): Promise<TenantRecord> {
  const result = await createTenantFn(input)
  return result.data as TenantRecord
}

export async function getTenant(tenantId: string): Promise<TenantRecord | null> {
  const result = await getTenantFn({ tenantId })
  return result.data as TenantRecord | null
}

export async function listMyTenants(): Promise<TenantRecord[]> {
  const result = await listMyTenantsFn({})
  return result.data as TenantRecord[]
}

// ── Identities ────────────────────────────────────────────────────────────────

export async function createIdentity(tenantId: string, input: { type: IdentityType; userId?: string; organizationId?: string; workspaceId?: string; displayName: string; roles?: string[] }): Promise<IdentityRecord> {
  const result = await createIdentityFn({ tenantId, ...input })
  return result.data as IdentityRecord
}

export async function listIdentities(tenantId: string): Promise<IdentityRecord[]> {
  const result = await listIdentitiesFn({ tenantId })
  return result.data as IdentityRecord[]
}

// ── RBAC ──────────────────────────────────────────────────────────────────────

export async function checkPermission(tenantId: string, action: PermissionAction): Promise<boolean> {
  const result = await checkPermissionFn({ tenantId, action })
  return result.data as boolean
}

// ── Roles ─────────────────────────────────────────────────────────────────────

export async function createRole(tenantId: string, input: { name: string; scope: RoleScope; permissions: PermissionAction[]; inheritsFrom?: string }): Promise<RoleRecord> {
  const result = await createRoleFn({ tenantId, ...input })
  return result.data as RoleRecord
}

export async function listRoles(tenantId: string): Promise<RoleRecord[]> {
  const result = await listRolesFn({ tenantId })
  return result.data as RoleRecord[]
}

export async function assignRole(tenantId: string, input: { identityId: string; roleId: string; scope: RoleScope; scopeId?: string; expiresAt?: string; delegatedBy?: string }): Promise<RoleAssignmentRecord> {
  const result = await assignRoleFn({ tenantId, ...input })
  return result.data as RoleAssignmentRecord
}

export async function revokeRoleAssignment(tenantId: string, assignmentId: string): Promise<boolean> {
  const result = await revokeRoleAssignmentFn({ tenantId, assignmentId })
  return result.data as boolean
}

// ── Policies ──────────────────────────────────────────────────────────────────

export async function createPolicy(tenantId: string, input: { name: string; description: string; action: PermissionAction; result: PolicyResult; requiredRole?: string }): Promise<PolicyRecord> {
  const result = await createPolicyFn({ tenantId, ...input })
  return result.data as PolicyRecord
}

export async function updatePolicy(tenantId: string, policyId: string, fields: Partial<{ name: string; description: string; result: PolicyResult; requiredRole: string | null; enabled: boolean }>): Promise<PolicyRecord | null> {
  const result = await updatePolicyFn({ tenantId, policyId, ...fields })
  return result.data as PolicyRecord | null
}

export async function listPolicies(tenantId: string): Promise<PolicyRecord[]> {
  const result = await listPoliciesFn({ tenantId })
  return result.data as PolicyRecord[]
}

export async function evaluatePolicy(tenantId: string, action: PermissionAction): Promise<PolicyEvaluation> {
  const result = await evaluatePolicyFn({ tenantId, action })
  return result.data as PolicyEvaluation
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function createSession(tenantId: string, input: { identityId: string; deviceInfo?: string; browser?: string; ipAddress?: string; location?: string }): Promise<SessionRecord> {
  const result = await createSessionFn({ tenantId, ...input })
  return result.data as SessionRecord
}

export async function refreshSession(tenantId: string, sessionId: string): Promise<SessionRecord | null> {
  const result = await refreshSessionFn({ tenantId, sessionId })
  return result.data as SessionRecord | null
}

export async function revokeSession(tenantId: string, sessionId: string): Promise<SessionRecord | null> {
  const result = await revokeSessionFn({ tenantId, sessionId })
  return result.data as SessionRecord | null
}

export async function listSessions(tenantId: string, forUserId?: string): Promise<SessionRecord[]> {
  const result = await listSessionsFn({ tenantId, forUserId })
  return result.data as SessionRecord[]
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function createGroup(tenantId: string, name: string, description?: string): Promise<GroupRecord> {
  const result = await createGroupFn({ tenantId, name, description })
  return result.data as GroupRecord
}

export async function listGroups(tenantId: string): Promise<GroupRecord[]> {
  const result = await listGroupsFn({ tenantId })
  return result.data as GroupRecord[]
}

export async function addGroupMember(tenantId: string, groupId: string, identityId: string): Promise<GroupRecord | null> {
  const result = await addGroupMemberFn({ tenantId, groupId, identityId })
  return result.data as GroupRecord | null
}

export async function removeGroupMember(tenantId: string, groupId: string, identityId: string): Promise<GroupRecord | null> {
  const result = await removeGroupMemberFn({ tenantId, groupId, identityId })
  return result.data as GroupRecord | null
}

export async function assignRoleToGroup(tenantId: string, groupId: string, roleId: string): Promise<GroupRecord | null> {
  const result = await assignRoleToGroupFn({ tenantId, groupId, roleId })
  return result.data as GroupRecord | null
}

// ── User Directory ────────────────────────────────────────────────────────────

export async function createServiceAccount(tenantId: string, name: string, description?: string): Promise<ServiceAccountRecord> {
  const result = await createServiceAccountFn({ tenantId, name, description })
  return result.data as ServiceAccountRecord
}

export async function listServiceAccounts(tenantId: string): Promise<ServiceAccountRecord[]> {
  const result = await listServiceAccountsFn({ tenantId })
  return result.data as ServiceAccountRecord[]
}

export async function getDirectoryView(tenantId: string, organizationId?: string): Promise<DirectoryView> {
  const result = await getDirectoryViewFn({ tenantId, organizationId })
  return result.data as DirectoryView
}

// ── Audit ─────────────────────────────────────────────────────────────────────

export async function listAuditEvents(tenantId: string, limit?: number): Promise<SecurityAuditRecord[]> {
  const result = await listAuditEventsFn({ tenantId, limit })
  return result.data as SecurityAuditRecord[]
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function getSecurityAnalytics(tenantId: string): Promise<SecurityAnalyticsSnapshot> {
  const result = await getSecurityAnalyticsFn({ tenantId })
  return result.data as SecurityAnalyticsSnapshot
}
