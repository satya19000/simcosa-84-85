import type * as admin from 'firebase-admin'
import type { TenantEngine } from './TenantEngine'
import type { RoleManager } from './RoleManager'
import type { PermissionManager } from './PermissionManager'
import type { PermissionAction, RoleScope } from './SecurityTypes'

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
export class RBACEngine {
  constructor(
    _db: admin.firestore.Firestore,
    private readonly tenants: TenantEngine,
    private readonly roles: RoleManager,
    private readonly permissions: PermissionManager
  ) {}

  /** Non-throwing permission check. */
  async can(tenantId: string, userId: string, action: PermissionAction): Promise<boolean> {
    if (!(await this.tenants.hasIdentityInTenant(tenantId, userId))) return false
    return this.permissions.hasPermission(tenantId, userId, action)
  }

  /** Throws if userId lacks `action` within tenantId. */
  async requirePermission(tenantId: string, userId: string, action: PermissionAction): Promise<void> {
    const allowed = await this.can(tenantId, userId, action)
    if (!allowed) {
      throw new Error(`Access denied: user ${userId} lacks permission "${action}" in tenant ${tenantId}`)
    }
  }

  /** Throws if userId does not hold `roleName` (directly or via assignment) at/above the given scope. */
  async requireRole(tenantId: string, userId: string, roleName: string, scope?: RoleScope): Promise<void> {
    const identity = await this.tenants.requireIdentity(tenantId, userId)
    if (identity.roles.includes(roleName)) return

    const assignments = await this.roles.listAssignmentsForIdentity(tenantId, userId, identity.identityId)
    for (const assignment of assignments) {
      const role = await this.roles.getRole(tenantId, userId, assignment.roleId)
      if (role && role.name === roleName && (!scope || assignment.scope === scope)) return
    }

    throw new Error(`Access denied: user ${userId} does not hold role "${roleName}" in tenant ${tenantId}`)
  }
}
