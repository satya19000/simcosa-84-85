import type * as admin from 'firebase-admin'
import { TenantEngine } from './TenantEngine'
import { IdentityEngine } from './IdentityEngine'
import { RoleManager } from './RoleManager'
import { PermissionManager } from './PermissionManager'
import { RBACEngine } from './RBACEngine'
import { PolicyEngine } from './PolicyEngine'
import { SessionManager } from './SessionManager'
import { UserDirectory } from './UserDirectory'
import { GroupManager } from './GroupManager'
import { SecurityAudit } from './SecurityAudit'
import { SecurityAnalytics } from './SecurityAnalytics'
import { SecurityLogger } from './SecurityLogger'
import { SecurityEventType } from './SecurityEvents'
import type { ApprovalEngine } from '../delegation/ApprovalEngine'
import type { SecurityConfig } from './SecurityConfig'
import type {
  TenantRecord, TenantType, IdentityRecord, IdentityType, RoleRecord, RoleScope,
  PermissionAction, PolicyRecord, PolicyResult, PolicyEvaluation, SessionRecord,
  GroupRecord, SecurityAuditRecord, ServiceAccountRecord, DirectoryView, RoleAssignmentRecord,
} from './SecurityTypes'
import type { SecurityAnalyticsSnapshot } from './SecurityAnalytics'

/**
 * Facade orchestrating the entire Enterprise Identity, Security, RBAC,
 * Policy, and Multi-Tenant platform. Mirrors OrganizationEngine's/
 * ApprovalEngine's constructor signature and composition style — this
 * class never duplicates RBAC or approval logic, it only composes the
 * Manager/Engine classes below it.
 *
 * HARD INVARIANT (the security-module equivalent of "no approval bypass" /
 * "no cross-organization access"): every method that reads or writes
 * anything under tenants/{tenantId}/** ultimately goes through
 * TenantEngine.requireIdentity (directly or via a Manager that calls it).
 * No method may skip this check. There is no cross-tenant access path.
 */
export class SecurityEngine {
  private readonly tenants: TenantEngine
  private readonly identities: IdentityEngine
  private readonly roleManager: RoleManager
  private readonly permissionManager: PermissionManager
  private readonly rbac: RBACEngine
  private readonly policies: PolicyEngine
  private readonly sessions: SessionManager
  private readonly directory: UserDirectory
  private readonly groups: GroupManager
  private readonly audit: SecurityAudit
  private readonly analytics: SecurityAnalytics
  private readonly logger: SecurityLogger

  constructor(
    _db: admin.firestore.Firestore,
    _config: SecurityConfig,
    _apiKey: string,
    approvalEngine: ApprovalEngine
  ) {
    this.tenants = new TenantEngine(_db)
    this.identities = new IdentityEngine(_db, this.tenants)
    this.roleManager = new RoleManager(_db, this.tenants)
    this.permissionManager = new PermissionManager(_db, this.tenants, this.roleManager)
    this.rbac = new RBACEngine(_db, this.tenants, this.roleManager, this.permissionManager)
    this.policies = new PolicyEngine(_db, this.tenants, this.rbac, approvalEngine)
    this.sessions = new SessionManager(_db, this.tenants)
    this.groups = new GroupManager(_db, this.tenants)
    this.directory = new UserDirectory(_db, this.tenants, this.identities, this.groups, this.roleManager)
    this.audit = new SecurityAudit(_db, this.tenants)
    this.analytics = new SecurityAnalytics(this.tenants, this.identities, this.roleManager, this.policies, this.sessions, this.audit)
    this.logger = new SecurityLogger()
  }

  // ── Tenant lifecycle ──────────────────────────────────────────────────────

  async createTenant(
    userId: string,
    input: { name: string; tenantType: TenantType; organizationId?: string | null; plan?: TenantRecord['plan'] }
  ): Promise<TenantRecord> {
    const tenant = await this.tenants.createTenant(userId, input)
    await this.identities.createFirstIdentity(tenant.tenantId, userId, {
      type: 'personal_user',
      displayName: userId,
      roles: ['tenant_owner'],
    })
    await this.roleManager.seedSystemRoles(tenant.tenantId, userId)
    await this.audit.record(tenant.tenantId, userId, {
      action: SecurityEventType.TENANT_CREATED,
      resource: `tenants/${tenant.tenantId}`,
      organizationId: tenant.organizationId,
      after: { name: tenant.name, tenantType: tenant.tenantType },
      riskLevel: 'medium',
    })
    this.logger.info(tenant.tenantId, SecurityEventType.TENANT_CREATED, { userId })
    return tenant
  }

  async getTenant(userId: string, tenantId: string): Promise<TenantRecord | null> {
    await this.tenants.requireIdentity(tenantId, userId)
    return this.tenants.getTenant(tenantId)
  }

  async listMyTenants(userId: string): Promise<TenantRecord[]> {
    return this.tenants.listTenantsForOwner(userId)
  }

  // ── Identities ─────────────────────────────────────────────────────────────

  async createIdentity(
    userId: string,
    tenantId: string,
    input: { type: IdentityType; userId?: string | null; organizationId?: string | null; workspaceId?: string | null; displayName: string; roles?: string[] }
  ): Promise<IdentityRecord> {
    await this.rbac.requirePermission(tenantId, userId, 'security.manage')
    const identity = await this.identities.createIdentity(tenantId, userId, input)
    await this.audit.record(tenantId, userId, {
      action: SecurityEventType.IDENTITY_CREATED,
      resource: `tenants/${tenantId}/identities/${identity.identityId}`,
      organizationId: input.organizationId ?? null,
      workspaceId: input.workspaceId ?? null,
      after: { type: identity.type, displayName: identity.displayName },
      riskLevel: 'medium',
    })
    return identity
  }

  async listIdentities(userId: string, tenantId: string): Promise<IdentityRecord[]> {
    return this.identities.listIdentities(tenantId, userId)
  }

  // ── RBAC passthrough ──────────────────────────────────────────────────────

  async can(userId: string, tenantId: string, action: PermissionAction): Promise<boolean> {
    return this.rbac.can(tenantId, userId, action)
  }

  async requirePermission(userId: string, tenantId: string, action: PermissionAction): Promise<void> {
    return this.rbac.requirePermission(tenantId, userId, action)
  }

  async requireRole(userId: string, tenantId: string, roleName: string, scope?: RoleScope): Promise<void> {
    return this.rbac.requireRole(tenantId, userId, roleName, scope)
  }

  // ── Roles ──────────────────────────────────────────────────────────────────

  async createRole(
    userId: string,
    tenantId: string,
    input: { name: string; scope: RoleScope; permissions: PermissionAction[]; inheritsFrom?: string | null }
  ): Promise<RoleRecord> {
    await this.rbac.requirePermission(tenantId, userId, 'security.manage')
    const role = await this.roleManager.createRole(tenantId, userId, input)
    await this.audit.record(tenantId, userId, {
      action: SecurityEventType.ROLE_CREATED,
      resource: `tenants/${tenantId}/roles/${role.roleId}`,
      after: { name: role.name, permissions: role.permissions },
      riskLevel: 'medium',
    })
    return role
  }

  async listRoles(userId: string, tenantId: string): Promise<RoleRecord[]> {
    return this.roleManager.listRoles(tenantId, userId)
  }

  async assignRole(
    userId: string,
    tenantId: string,
    input: { identityId: string; roleId: string; scope: RoleScope; scopeId?: string | null; expiresAt?: string | null; delegatedBy?: string | null }
  ): Promise<RoleAssignmentRecord> {
    await this.rbac.requirePermission(tenantId, userId, 'security.manage')
    const assignment = await this.roleManager.assignRole(tenantId, userId, input)
    await this.audit.record(tenantId, userId, {
      action: SecurityEventType.ROLE_ASSIGNED,
      resource: `tenants/${tenantId}/roleAssignments/${assignment.assignmentId}`,
      after: { identityId: input.identityId, roleId: input.roleId, scope: input.scope, expiresAt: input.expiresAt ?? null },
      riskLevel: 'high',
    })
    return assignment
  }

  async revokeRoleAssignment(userId: string, tenantId: string, assignmentId: string): Promise<boolean> {
    await this.rbac.requirePermission(tenantId, userId, 'security.manage')
    const revoked = await this.roleManager.revokeAssignment(tenantId, userId, assignmentId)
    if (revoked) {
      await this.audit.record(tenantId, userId, {
        action: SecurityEventType.ROLE_REVOKED,
        resource: `tenants/${tenantId}/roleAssignments/${assignmentId}`,
        riskLevel: 'high',
      })
    }
    return revoked
  }

  // ── Policies ───────────────────────────────────────────────────────────────

  async createPolicy(
    userId: string,
    tenantId: string,
    input: { name: string; description: string; action: PermissionAction; result: PolicyResult; requiredRole?: string | null }
  ): Promise<PolicyRecord> {
    await this.rbac.requirePermission(tenantId, userId, 'security.manage')
    const policy = await this.policies.createPolicy(tenantId, userId, input)
    await this.audit.record(tenantId, userId, {
      action: SecurityEventType.POLICY_CREATED,
      resource: `tenants/${tenantId}/policies/${policy.policyId}`,
      after: { name: policy.name, action: policy.action, result: policy.result },
      riskLevel: 'high',
    })
    return policy
  }

  async updatePolicy(
    userId: string,
    tenantId: string,
    policyId: string,
    fields: Partial<Pick<PolicyRecord, 'name' | 'description' | 'result' | 'requiredRole' | 'enabled'>>
  ): Promise<PolicyRecord | null> {
    await this.rbac.requirePermission(tenantId, userId, 'security.manage')
    const before = await this.policies.getPolicy(tenantId, userId, policyId)
    const updated = await this.policies.updatePolicy(tenantId, userId, policyId, fields)
    if (updated) {
      await this.audit.record(tenantId, userId, {
        action: SecurityEventType.POLICY_UPDATED,
        resource: `tenants/${tenantId}/policies/${policyId}`,
        before: before ? { result: before.result, enabled: before.enabled } : null,
        after: { result: updated.result, enabled: updated.enabled },
        riskLevel: 'high',
      })
    }
    return updated
  }

  async listPolicies(userId: string, tenantId: string): Promise<PolicyRecord[]> {
    return this.policies.listPolicies(tenantId, userId)
  }

  async evaluatePolicy(userId: string, tenantId: string, action: PermissionAction): Promise<PolicyEvaluation> {
    return this.policies.evaluate(tenantId, userId, action)
  }

  /** The ONLY way to act on a `requireApproval` policy result — routes to the real ApprovalEngine, never bypassed. */
  get policyEngine(): PolicyEngine {
    return this.policies
  }

  // ── Sessions ───────────────────────────────────────────────────────────────

  async createSession(
    userId: string,
    tenantId: string,
    input: { identityId: string; deviceInfo?: string | null; browser?: string | null; ipAddress?: string | null; location?: string | null }
  ): Promise<SessionRecord> {
    const session = await this.sessions.createSession(tenantId, userId, input)
    await this.audit.record(tenantId, userId, {
      action: SecurityEventType.SESSION_CREATED,
      resource: `tenants/${tenantId}/sessions/${session.sessionId}`,
      riskLevel: 'low',
    })
    return session
  }

  async refreshSession(userId: string, tenantId: string, sessionId: string): Promise<SessionRecord | null> {
    return this.sessions.refreshSession(tenantId, userId, sessionId)
  }

  async revokeSession(userId: string, tenantId: string, sessionId: string): Promise<SessionRecord | null> {
    const revoked = await this.sessions.revokeSession(tenantId, userId, sessionId)
    if (revoked) {
      await this.audit.record(tenantId, userId, {
        action: SecurityEventType.SESSION_REVOKED,
        resource: `tenants/${tenantId}/sessions/${sessionId}`,
        riskLevel: 'medium',
      })
    }
    return revoked
  }

  async listSessions(userId: string, tenantId: string, forUserId?: string): Promise<SessionRecord[]> {
    return this.sessions.listSessions(tenantId, userId, forUserId)
  }

  // ── Groups ─────────────────────────────────────────────────────────────────

  async createGroup(userId: string, tenantId: string, input: { name: string; description?: string }): Promise<GroupRecord> {
    const group = await this.groups.createGroup(tenantId, userId, input)
    await this.audit.record(tenantId, userId, {
      action: SecurityEventType.GROUP_CREATED,
      resource: `tenants/${tenantId}/groups/${group.groupId}`,
      after: { name: group.name },
      riskLevel: 'low',
    })
    return group
  }

  async listGroups(userId: string, tenantId: string): Promise<GroupRecord[]> {
    return this.groups.listGroups(tenantId, userId)
  }

  async addMemberToGroup(userId: string, tenantId: string, groupId: string, identityId: string): Promise<GroupRecord | null> {
    const group = await this.groups.addMemberToGroup(tenantId, userId, groupId, identityId)
    if (group) {
      await this.audit.record(tenantId, userId, {
        action: SecurityEventType.GROUP_MEMBER_ADDED,
        resource: `tenants/${tenantId}/groups/${groupId}`,
        after: { identityId },
        riskLevel: 'low',
      })
    }
    return group
  }

  async removeMemberFromGroup(userId: string, tenantId: string, groupId: string, identityId: string): Promise<GroupRecord | null> {
    const group = await this.groups.removeMemberFromGroup(tenantId, userId, groupId, identityId)
    if (group) {
      await this.audit.record(tenantId, userId, {
        action: SecurityEventType.GROUP_MEMBER_REMOVED,
        resource: `tenants/${tenantId}/groups/${groupId}`,
        before: { identityId },
        riskLevel: 'low',
      })
    }
    return group
  }

  async assignRoleToGroup(userId: string, tenantId: string, groupId: string, roleId: string): Promise<GroupRecord | null> {
    const group = await this.groups.assignRoleToGroup(tenantId, userId, groupId, roleId)
    if (group) {
      await this.audit.record(tenantId, userId, {
        action: SecurityEventType.GROUP_ROLE_ASSIGNED,
        resource: `tenants/${tenantId}/groups/${groupId}`,
        after: { roleId },
        riskLevel: 'medium',
      })
    }
    return group
  }

  // ── User Directory ────────────────────────────────────────────────────────

  async createServiceAccount(userId: string, tenantId: string, input: { name: string; description?: string }): Promise<ServiceAccountRecord> {
    await this.rbac.requirePermission(tenantId, userId, 'security.manage')
    const account = await this.directory.createServiceAccount(tenantId, userId, input)
    await this.audit.record(tenantId, userId, {
      action: SecurityEventType.SERVICE_ACCOUNT_CREATED,
      resource: `tenants/${tenantId}/serviceAccounts/${account.serviceAccountId}`,
      after: { name: account.name },
      riskLevel: 'high',
    })
    return account
  }

  async listServiceAccounts(userId: string, tenantId: string): Promise<ServiceAccountRecord[]> {
    return this.directory.listServiceAccounts(tenantId, userId)
  }

  async getDirectoryView(userId: string, tenantId: string, organizationId: string | null): Promise<DirectoryView> {
    return this.directory.getDirectoryView(tenantId, userId, organizationId)
  }

  // ── Audit ──────────────────────────────────────────────────────────────────

  async listAuditEvents(userId: string, tenantId: string, limit?: number): Promise<SecurityAuditRecord[]> {
    return this.audit.listEvents(tenantId, userId, limit)
  }

  /** Exposed so action handlers can record audit events for sensitive operations they perform directly. */
  get auditLog(): SecurityAudit {
    return this.audit
  }

  // ── Analytics ──────────────────────────────────────────────────────────────

  async getAnalytics(userId: string, tenantId: string): Promise<SecurityAnalyticsSnapshot> {
    return this.analytics.getSnapshot(tenantId, userId)
  }
}
