"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACEngine = void 0;
/**
 * Reusable permission-evaluation API. Centralizes ALL role/permission
 * decision logic for Phase 5.2 — nothing else in security/ or its
 * consumers should hardcode a permission check; they call `can`,
 * `requirePermission`, or `requireRole` here instead.
 *
 * This intentionally does NOT replace `organization/WorkspacePermissions`
 * (Phase 5.1's role-hierarchy check for organizations/{organizationId}/**).
 * It is a more general permission layer that organization permissions can
 * delegate to in a future phase — see security/README.md "Organization
 * integration" for exactly what is/isn't wired today.
 */
class RBACEngine {
    constructor(_db, tenants, roles, permissions) {
        this.tenants = tenants;
        this.roles = roles;
        this.permissions = permissions;
    }
    /** Non-throwing permission check. */
    async can(tenantId, userId, action) {
        if (!(await this.tenants.hasIdentityInTenant(tenantId, userId)))
            return false;
        return this.permissions.hasPermission(tenantId, userId, action);
    }
    /** Throws if userId lacks `action` within tenantId. */
    async requirePermission(tenantId, userId, action) {
        const allowed = await this.can(tenantId, userId, action);
        if (!allowed) {
            throw new Error(`Access denied: user ${userId} lacks permission "${action}" in tenant ${tenantId}`);
        }
    }
    /** Throws if userId does not hold `roleName` (directly or via assignment) at/above the given scope. */
    async requireRole(tenantId, userId, roleName, scope) {
        const identity = await this.tenants.requireIdentity(tenantId, userId);
        if (identity.roles.includes(roleName))
            return;
        const assignments = await this.roles.listAssignmentsForIdentity(tenantId, userId, identity.identityId);
        for (const assignment of assignments) {
            const role = await this.roles.getRole(tenantId, userId, assignment.roleId);
            if (role && role.name === roleName && (!scope || assignment.scope === scope))
                return;
        }
        throw new Error(`Access denied: user ${userId} does not hold role "${roleName}" in tenant ${tenantId}`);
    }
}
exports.RBACEngine = RBACEngine;
//# sourceMappingURL=RBACEngine.js.map