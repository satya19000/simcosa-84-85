"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionManager = void 0;
/**
 * Single source of truth for resolving "what permissions does identity X
 * effectively have in tenant Y, optionally scoped to Z" by composing
 * IdentityEngine's `roles: string[]` field with RoleManager's role
 * definitions and role-assignment join records (including inherited,
 * temporary, and delegated roles).
 *
 * Nothing outside RBACEngine/PermissionManager should hardcode a role or
 * permission check — every consumer (SecurityEngine, action handlers,
 * future organization-integration code) must call through here.
 */
class PermissionManager {
    constructor(_db, tenants, roles) {
        this.tenants = tenants;
        this.roles = roles;
    }
    /** Resolve the full effective permission set for a userId within a tenant, from identity.roles + role assignments. */
    async effectivePermissions(tenantId, userId) {
        const identity = await this.tenants.getIdentityForUser(tenantId, userId);
        if (!identity)
            return [];
        const permissionSet = new Set(identity.permissions);
        // Permissions from named roles attached directly to the identity record.
        for (const roleName of identity.roles) {
            const role = await this.roles.getRoleByName(tenantId, roleName);
            if (!role)
                continue;
            const effective = await this.roles.resolveEffectivePermissions(tenantId, role.roleId);
            for (const p of effective)
                permissionSet.add(p);
        }
        // Permissions from role assignments (covers temporary/delegated/scoped roles).
        const assignments = await this.roles.listAssignmentsForIdentity(tenantId, identity.userId ?? userId, identity.identityId);
        for (const assignment of assignments) {
            const effective = await this.roles.resolveEffectivePermissions(tenantId, assignment.roleId);
            for (const p of effective)
                permissionSet.add(p);
        }
        return Array.from(permissionSet);
    }
    async hasPermission(tenantId, userId, action) {
        const perms = await this.effectivePermissions(tenantId, userId);
        return perms.includes(action);
    }
}
exports.PermissionManager = PermissionManager;
//# sourceMappingURL=PermissionManager.js.map