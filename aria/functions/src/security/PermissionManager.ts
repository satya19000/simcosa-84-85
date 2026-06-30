import type * as admin from 'firebase-admin'
import type { TenantEngine } from './TenantEngine'
import type { RoleManager } from './RoleManager'
import type { PermissionAction } from './SecurityTypes'

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
export class PermissionManager {
  constructor(
    _db: admin.firestore.Firestore,
    private readonly tenants: TenantEngine,
    private readonly roles: RoleManager
  ) {}

  /** Resolve the full effective permission set for a userId within a tenant, from identity.roles + role assignments. */
  async effectivePermissions(tenantId: string, userId: string): Promise<PermissionAction[]> {
    const identity = await this.tenants.getIdentityForUser(tenantId, userId)
    if (!identity) return []

    const permissionSet = new Set<PermissionAction>(identity.permissions)

    // Permissions from named roles attached directly to the identity record.
    for (const roleName of identity.roles) {
      const role = await this.roles.getRoleByName(tenantId, roleName)
      if (!role) continue
      const effective = await this.roles.resolveEffectivePermissions(tenantId, role.roleId)
      for (const p of effective) permissionSet.add(p)
    }

    // Permissions from role assignments (covers temporary/delegated/scoped roles).
    const assignments = await this.roles.listAssignmentsForIdentity(tenantId, identity.userId ?? userId, identity.identityId)
    for (const assignment of assignments) {
      const effective = await this.roles.resolveEffectivePermissions(tenantId, assignment.roleId)
      for (const p of effective) permissionSet.add(p)
    }

    return Array.from(permissionSet)
  }

  async hasPermission(tenantId: string, userId: string, action: PermissionAction): Promise<boolean> {
    const perms = await this.effectivePermissions(tenantId, userId)
    return perms.includes(action)
  }
}
