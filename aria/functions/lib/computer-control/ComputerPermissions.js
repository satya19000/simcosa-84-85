"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerPermissions = void 0;
/**
 * Thin adapter over the real RBACEngine — never reimplements permission logic.
 *
 * Computer-control permissions are mapped to the existing PermissionAction
 * vocabulary where possible, and documented as needed capability grants.
 * Default deny: unless the user has been granted the specific computer.*
 * scope via RBAC, all sensitive computer actions are rejected.
 *
 * This class mirrors ModelPermissions.ts's no-bypass bridge pattern exactly.
 */
class ComputerPermissions {
    constructor(rbac, tenants, capabilityRegistry) {
        this.rbac = rbac;
        this.tenants = tenants;
        this.capabilityRegistry = capabilityRegistry;
    }
    /**
     * Map a computer permission scope to an existing PermissionAction.
     * Computer control capabilities default to requiring 'security.manage' for
     * sensitive scopes and 'tasks.write' for lower-risk scopes. This provides
     * a safe deny-by-default baseline without requiring a new PermissionAction
     * type in this phase.
     */
    mapToPermissionAction(permission) {
        const highPriv = [
            'computer.screenshot',
            'computer.ocr',
            'computer.files.delete',
            'computer.forms.submit',
            'computer.network.request',
        ];
        const docPriv = [
            'computer.files.read',
            'computer.files.write',
            'computer.browser.tabs',
            'computer.apps.open',
        ];
        if (highPriv.includes(permission))
            return 'security.manage';
        if (docPriv.includes(permission))
            return 'documents.write';
        return 'tasks.write';
    }
    /** Non-throwing check. Returns true only if all required permissions are granted. */
    async canExecuteCapability(tenantId, userId, capabilityId) {
        const descriptor = this.capabilityRegistry.get(capabilityId);
        if (!descriptor)
            return false;
        if (descriptor.alwaysBlocked)
            return false;
        if (descriptor.policyBlocked)
            return false;
        for (const perm of descriptor.requiredPermissions) {
            const action = this.mapToPermissionAction(perm);
            const allowed = await this.rbac.can(tenantId, userId, action);
            if (!allowed)
                return false;
        }
        return true;
    }
    /** Throwing version — throws if any required permission is missing. */
    async requireCapabilityPermission(tenantId, userId, capabilityId) {
        const descriptor = this.capabilityRegistry.get(capabilityId);
        if (!descriptor)
            throw new Error(`Unknown capability: ${capabilityId}`);
        if (descriptor.alwaysBlocked)
            throw new Error(`Capability "${capabilityId}" is unconditionally blocked.`);
        if (descriptor.policyBlocked)
            throw new Error(`Capability "${capabilityId}" is blocked by policy.`);
        for (const perm of descriptor.requiredPermissions) {
            const action = this.mapToPermissionAction(perm);
            await this.rbac.requirePermission(tenantId, userId, action);
        }
    }
    /** Verify tenant membership. Must be the first call in every tenant-scoped method. */
    async requireTenantMembership(tenantId, userId) {
        await this.tenants.requireIdentity(tenantId, userId);
    }
}
exports.ComputerPermissions = ComputerPermissions;
//# sourceMappingURL=ComputerPermissions.js.map