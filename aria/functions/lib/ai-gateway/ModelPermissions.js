"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelPermissions = void 0;
/**
 * Thin adapter over the real RBACEngine — never reimplements permission
 * logic. The AI Gateway doesn't define a brand-new permission action;
 * `security.manage` (already in PermissionAction) governs who may update
 * AI policy, mirroring how MarketplaceEngine reuses RBAC rather than
 * inventing a parallel scope system.
 */
class ModelPermissions {
    constructor(rbac) {
        this.rbac = rbac;
    }
    async canManagePolicy(tenantId, userId) {
        return this.rbac.can(tenantId, userId, 'security.manage');
    }
    async requireManagePolicy(tenantId, userId) {
        await this.rbac.requirePermission(tenantId, userId, 'security.manage');
    }
}
exports.ModelPermissions = ModelPermissions;
//# sourceMappingURL=ModelPermissions.js.map