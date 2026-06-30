"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityEngine = void 0;
const TenantEngine_1 = require("./TenantEngine");
const IdentityEngine_1 = require("./IdentityEngine");
const RoleManager_1 = require("./RoleManager");
const PermissionManager_1 = require("./PermissionManager");
const RBACEngine_1 = require("./RBACEngine");
const PolicyEngine_1 = require("./PolicyEngine");
const SessionManager_1 = require("./SessionManager");
const UserDirectory_1 = require("./UserDirectory");
const GroupManager_1 = require("./GroupManager");
const SecurityAudit_1 = require("./SecurityAudit");
const SecurityAnalytics_1 = require("./SecurityAnalytics");
const SecurityLogger_1 = require("./SecurityLogger");
const SecurityEvents_1 = require("./SecurityEvents");
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
class SecurityEngine {
    constructor(_db, _config, _apiKey, approvalEngine) {
        this.tenants = new TenantEngine_1.TenantEngine(_db);
        this.identities = new IdentityEngine_1.IdentityEngine(_db, this.tenants);
        this.roleManager = new RoleManager_1.RoleManager(_db, this.tenants);
        this.permissionManager = new PermissionManager_1.PermissionManager(_db, this.tenants, this.roleManager);
        this.rbac = new RBACEngine_1.RBACEngine(_db, this.tenants, this.roleManager, this.permissionManager);
        this.policies = new PolicyEngine_1.PolicyEngine(_db, this.tenants, this.rbac, approvalEngine);
        this.sessions = new SessionManager_1.SessionManager(_db, this.tenants);
        this.groups = new GroupManager_1.GroupManager(_db, this.tenants);
        this.directory = new UserDirectory_1.UserDirectory(_db, this.tenants, this.identities, this.groups, this.roleManager);
        this.audit = new SecurityAudit_1.SecurityAudit(_db, this.tenants);
        this.analytics = new SecurityAnalytics_1.SecurityAnalytics(this.tenants, this.identities, this.roleManager, this.policies, this.sessions, this.audit);
        this.logger = new SecurityLogger_1.SecurityLogger();
    }
    // ── Tenant lifecycle ──────────────────────────────────────────────────────
    async createTenant(userId, input) {
        const tenant = await this.tenants.createTenant(userId, input);
        await this.identities.createFirstIdentity(tenant.tenantId, userId, {
            type: 'personal_user',
            displayName: userId,
            roles: ['tenant_owner'],
        });
        await this.roleManager.seedSystemRoles(tenant.tenantId, userId);
        await this.audit.record(tenant.tenantId, userId, {
            action: SecurityEvents_1.SecurityEventType.TENANT_CREATED,
            resource: `tenants/${tenant.tenantId}`,
            organizationId: tenant.organizationId,
            after: { name: tenant.name, tenantType: tenant.tenantType },
            riskLevel: 'medium',
        });
        this.logger.info(tenant.tenantId, SecurityEvents_1.SecurityEventType.TENANT_CREATED, { userId });
        return tenant;
    }
    async getTenant(userId, tenantId) {
        await this.tenants.requireIdentity(tenantId, userId);
        return this.tenants.getTenant(tenantId);
    }
    async listMyTenants(userId) {
        return this.tenants.listTenantsForOwner(userId);
    }
    // ── Identities ─────────────────────────────────────────────────────────────
    async createIdentity(userId, tenantId, input) {
        await this.rbac.requirePermission(tenantId, userId, 'security.manage');
        const identity = await this.identities.createIdentity(tenantId, userId, input);
        await this.audit.record(tenantId, userId, {
            action: SecurityEvents_1.SecurityEventType.IDENTITY_CREATED,
            resource: `tenants/${tenantId}/identities/${identity.identityId}`,
            organizationId: input.organizationId ?? null,
            workspaceId: input.workspaceId ?? null,
            after: { type: identity.type, displayName: identity.displayName },
            riskLevel: 'medium',
        });
        return identity;
    }
    async listIdentities(userId, tenantId) {
        return this.identities.listIdentities(tenantId, userId);
    }
    // ── RBAC passthrough ──────────────────────────────────────────────────────
    async can(userId, tenantId, action) {
        return this.rbac.can(tenantId, userId, action);
    }
    async requirePermission(userId, tenantId, action) {
        return this.rbac.requirePermission(tenantId, userId, action);
    }
    async requireRole(userId, tenantId, roleName, scope) {
        return this.rbac.requireRole(tenantId, userId, roleName, scope);
    }
    // ── Roles ──────────────────────────────────────────────────────────────────
    async createRole(userId, tenantId, input) {
        await this.rbac.requirePermission(tenantId, userId, 'security.manage');
        const role = await this.roleManager.createRole(tenantId, userId, input);
        await this.audit.record(tenantId, userId, {
            action: SecurityEvents_1.SecurityEventType.ROLE_CREATED,
            resource: `tenants/${tenantId}/roles/${role.roleId}`,
            after: { name: role.name, permissions: role.permissions },
            riskLevel: 'medium',
        });
        return role;
    }
    async listRoles(userId, tenantId) {
        return this.roleManager.listRoles(tenantId, userId);
    }
    async assignRole(userId, tenantId, input) {
        await this.rbac.requirePermission(tenantId, userId, 'security.manage');
        const assignment = await this.roleManager.assignRole(tenantId, userId, input);
        await this.audit.record(tenantId, userId, {
            action: SecurityEvents_1.SecurityEventType.ROLE_ASSIGNED,
            resource: `tenants/${tenantId}/roleAssignments/${assignment.assignmentId}`,
            after: { identityId: input.identityId, roleId: input.roleId, scope: input.scope, expiresAt: input.expiresAt ?? null },
            riskLevel: 'high',
        });
        return assignment;
    }
    async revokeRoleAssignment(userId, tenantId, assignmentId) {
        await this.rbac.requirePermission(tenantId, userId, 'security.manage');
        const revoked = await this.roleManager.revokeAssignment(tenantId, userId, assignmentId);
        if (revoked) {
            await this.audit.record(tenantId, userId, {
                action: SecurityEvents_1.SecurityEventType.ROLE_REVOKED,
                resource: `tenants/${tenantId}/roleAssignments/${assignmentId}`,
                riskLevel: 'high',
            });
        }
        return revoked;
    }
    // ── Policies ───────────────────────────────────────────────────────────────
    async createPolicy(userId, tenantId, input) {
        await this.rbac.requirePermission(tenantId, userId, 'security.manage');
        const policy = await this.policies.createPolicy(tenantId, userId, input);
        await this.audit.record(tenantId, userId, {
            action: SecurityEvents_1.SecurityEventType.POLICY_CREATED,
            resource: `tenants/${tenantId}/policies/${policy.policyId}`,
            after: { name: policy.name, action: policy.action, result: policy.result },
            riskLevel: 'high',
        });
        return policy;
    }
    async updatePolicy(userId, tenantId, policyId, fields) {
        await this.rbac.requirePermission(tenantId, userId, 'security.manage');
        const before = await this.policies.getPolicy(tenantId, userId, policyId);
        const updated = await this.policies.updatePolicy(tenantId, userId, policyId, fields);
        if (updated) {
            await this.audit.record(tenantId, userId, {
                action: SecurityEvents_1.SecurityEventType.POLICY_UPDATED,
                resource: `tenants/${tenantId}/policies/${policyId}`,
                before: before ? { result: before.result, enabled: before.enabled } : null,
                after: { result: updated.result, enabled: updated.enabled },
                riskLevel: 'high',
            });
        }
        return updated;
    }
    async listPolicies(userId, tenantId) {
        return this.policies.listPolicies(tenantId, userId);
    }
    async evaluatePolicy(userId, tenantId, action) {
        return this.policies.evaluate(tenantId, userId, action);
    }
    /** The ONLY way to act on a `requireApproval` policy result — routes to the real ApprovalEngine, never bypassed. */
    get policyEngine() {
        return this.policies;
    }
    // ── Sessions ───────────────────────────────────────────────────────────────
    async createSession(userId, tenantId, input) {
        const session = await this.sessions.createSession(tenantId, userId, input);
        await this.audit.record(tenantId, userId, {
            action: SecurityEvents_1.SecurityEventType.SESSION_CREATED,
            resource: `tenants/${tenantId}/sessions/${session.sessionId}`,
            riskLevel: 'low',
        });
        return session;
    }
    async refreshSession(userId, tenantId, sessionId) {
        return this.sessions.refreshSession(tenantId, userId, sessionId);
    }
    async revokeSession(userId, tenantId, sessionId) {
        const revoked = await this.sessions.revokeSession(tenantId, userId, sessionId);
        if (revoked) {
            await this.audit.record(tenantId, userId, {
                action: SecurityEvents_1.SecurityEventType.SESSION_REVOKED,
                resource: `tenants/${tenantId}/sessions/${sessionId}`,
                riskLevel: 'medium',
            });
        }
        return revoked;
    }
    async listSessions(userId, tenantId, forUserId) {
        return this.sessions.listSessions(tenantId, userId, forUserId);
    }
    // ── Groups ─────────────────────────────────────────────────────────────────
    async createGroup(userId, tenantId, input) {
        const group = await this.groups.createGroup(tenantId, userId, input);
        await this.audit.record(tenantId, userId, {
            action: SecurityEvents_1.SecurityEventType.GROUP_CREATED,
            resource: `tenants/${tenantId}/groups/${group.groupId}`,
            after: { name: group.name },
            riskLevel: 'low',
        });
        return group;
    }
    async listGroups(userId, tenantId) {
        return this.groups.listGroups(tenantId, userId);
    }
    async addMemberToGroup(userId, tenantId, groupId, identityId) {
        const group = await this.groups.addMemberToGroup(tenantId, userId, groupId, identityId);
        if (group) {
            await this.audit.record(tenantId, userId, {
                action: SecurityEvents_1.SecurityEventType.GROUP_MEMBER_ADDED,
                resource: `tenants/${tenantId}/groups/${groupId}`,
                after: { identityId },
                riskLevel: 'low',
            });
        }
        return group;
    }
    async removeMemberFromGroup(userId, tenantId, groupId, identityId) {
        const group = await this.groups.removeMemberFromGroup(tenantId, userId, groupId, identityId);
        if (group) {
            await this.audit.record(tenantId, userId, {
                action: SecurityEvents_1.SecurityEventType.GROUP_MEMBER_REMOVED,
                resource: `tenants/${tenantId}/groups/${groupId}`,
                before: { identityId },
                riskLevel: 'low',
            });
        }
        return group;
    }
    async assignRoleToGroup(userId, tenantId, groupId, roleId) {
        const group = await this.groups.assignRoleToGroup(tenantId, userId, groupId, roleId);
        if (group) {
            await this.audit.record(tenantId, userId, {
                action: SecurityEvents_1.SecurityEventType.GROUP_ROLE_ASSIGNED,
                resource: `tenants/${tenantId}/groups/${groupId}`,
                after: { roleId },
                riskLevel: 'medium',
            });
        }
        return group;
    }
    // ── User Directory ────────────────────────────────────────────────────────
    async createServiceAccount(userId, tenantId, input) {
        await this.rbac.requirePermission(tenantId, userId, 'security.manage');
        const account = await this.directory.createServiceAccount(tenantId, userId, input);
        await this.audit.record(tenantId, userId, {
            action: SecurityEvents_1.SecurityEventType.SERVICE_ACCOUNT_CREATED,
            resource: `tenants/${tenantId}/serviceAccounts/${account.serviceAccountId}`,
            after: { name: account.name },
            riskLevel: 'high',
        });
        return account;
    }
    async listServiceAccounts(userId, tenantId) {
        return this.directory.listServiceAccounts(tenantId, userId);
    }
    async getDirectoryView(userId, tenantId, organizationId) {
        return this.directory.getDirectoryView(tenantId, userId, organizationId);
    }
    // ── Audit ──────────────────────────────────────────────────────────────────
    async listAuditEvents(userId, tenantId, limit) {
        return this.audit.listEvents(tenantId, userId, limit);
    }
    /** Exposed so action handlers can record audit events for sensitive operations they perform directly. */
    get auditLog() {
        return this.audit;
    }
    // ── Analytics ──────────────────────────────────────────────────────────────
    async getAnalytics(userId, tenantId) {
        return this.analytics.getSnapshot(tenantId, userId);
    }
}
exports.SecurityEngine = SecurityEngine;
//# sourceMappingURL=SecurityEngine.js.map