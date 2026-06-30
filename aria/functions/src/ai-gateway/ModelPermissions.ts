import type { RBACEngine } from '../security/RBACEngine'

/**
 * Thin adapter over the real RBACEngine — never reimplements permission
 * logic. The AI Gateway doesn't define a brand-new permission action;
 * `security.manage` (already in PermissionAction) governs who may update
 * AI policy, mirroring how MarketplaceEngine reuses RBAC rather than
 * inventing a parallel scope system.
 */
export class ModelPermissions {
  constructor(private readonly rbac: RBACEngine) {}

  async canManagePolicy(tenantId: string, userId: string): Promise<boolean> {
    return this.rbac.can(tenantId, userId, 'security.manage')
  }

  async requireManagePolicy(tenantId: string, userId: string): Promise<void> {
    await this.rbac.requirePermission(tenantId, userId, 'security.manage')
  }
}
