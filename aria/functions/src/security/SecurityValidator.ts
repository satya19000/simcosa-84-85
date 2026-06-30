import { PERMISSION_ACTIONS } from './SecurityTypes'
import type { PermissionAction, PolicyResult, RoleScope, TenantType, IdentityType } from './SecurityTypes'

export class SecurityValidationError extends Error {
  constructor(field: string, reason: string) {
    super(`Validation failed for '${field}': ${reason}`)
    this.name = 'SecurityValidationError'
  }
}

const TENANT_TYPES: TenantType[] = ['personal', 'organization', 'enterprise', 'government', 'healthcare', 'education']
const IDENTITY_TYPES: IdentityType[] = ['personal_user', 'organization_member', 'guest', 'service_account', 'bot_account', 'super_admin']
const ROLE_SCOPES: RoleScope[] = ['tenant', 'organization', 'workspace']
const POLICY_RESULTS: PolicyResult[] = ['allow', 'deny', 'requireApproval', 'requireElevatedRole', 'auditOnly']

/** Static input validators, mirrors WorkspaceValidator.ts. Used by securityApi.ts and action handlers before touching SecurityEngine. */
export class SecurityValidator {
  static validateCreateTenant(data: { name?: unknown; tenantType?: unknown }): void {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new SecurityValidationError('name', 'must be a non-empty string')
    }
    if (!TENANT_TYPES.includes(data.tenantType as TenantType)) {
      throw new SecurityValidationError('tenantType', `must be one of: ${TENANT_TYPES.join(', ')}`)
    }
  }

  static validateIdentityType(value: unknown): void {
    if (!IDENTITY_TYPES.includes(value as IdentityType)) {
      throw new SecurityValidationError('type', `must be one of: ${IDENTITY_TYPES.join(', ')}`)
    }
  }

  static validateCreateRole(data: { name?: unknown; scope?: unknown; permissions?: unknown }): void {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new SecurityValidationError('name', 'must be a non-empty string')
    }
    if (!ROLE_SCOPES.includes(data.scope as RoleScope)) {
      throw new SecurityValidationError('scope', `must be one of: ${ROLE_SCOPES.join(', ')}`)
    }
    if (!Array.isArray(data.permissions) || data.permissions.some((p) => !PERMISSION_ACTIONS.includes(p as PermissionAction))) {
      throw new SecurityValidationError('permissions', `must be an array of valid permission actions: ${PERMISSION_ACTIONS.join(', ')}`)
    }
  }

  static validatePermissionAction(value: unknown): void {
    if (!PERMISSION_ACTIONS.includes(value as PermissionAction)) {
      throw new SecurityValidationError('action', `must be one of: ${PERMISSION_ACTIONS.join(', ')}`)
    }
  }

  static validateCreatePolicy(data: { name?: unknown; description?: unknown; action?: unknown; result?: unknown }): void {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new SecurityValidationError('name', 'must be a non-empty string')
    }
    if (typeof data.description !== 'string') {
      throw new SecurityValidationError('description', 'must be a string')
    }
    this.validatePermissionAction(data.action)
    if (!POLICY_RESULTS.includes(data.result as PolicyResult)) {
      throw new SecurityValidationError('result', `must be one of: ${POLICY_RESULTS.join(', ')}`)
    }
  }

  static validateCreateGroup(data: { name?: unknown }): void {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new SecurityValidationError('name', 'must be a non-empty string')
    }
  }
}
