import type { PermissionAction, RoleScope } from './SecurityTypes'

/** Static config for the security module, mirrors WorkspaceConfig.ts's plain-object style. */
export interface SecurityConfig {
  sessionTtlMs: number
  defaultSystemRoles: { name: string; scope: RoleScope; permissions: PermissionAction[] }[]
  maxTemporaryRoleDurationMs: number
}

export const DEFAULT_SYSTEM_ROLES: { name: string; scope: RoleScope; permissions: PermissionAction[] }[] = [
  {
    name: 'tenant_owner',
    scope: 'tenant',
    permissions: [
      'organization.read', 'organization.manage',
      'workspace.read', 'workspace.manage',
      'members.invite', 'members.remove',
      'tasks.read', 'tasks.write',
      'missions.read', 'missions.write',
      'approvals.read', 'approvals.approve',
      'documents.read', 'documents.write',
      'plugins.install',
      'security.manage',
      'audit.read',
      'billing.manage',
    ],
  },
  {
    name: 'tenant_admin',
    scope: 'tenant',
    permissions: [
      'organization.read', 'organization.manage',
      'workspace.read', 'workspace.manage',
      'members.invite', 'members.remove',
      'tasks.read', 'tasks.write',
      'missions.read', 'missions.write',
      'approvals.read', 'approvals.approve',
      'documents.read', 'documents.write',
      'plugins.install',
      'audit.read',
    ],
  },
  {
    name: 'workspace_manager',
    scope: 'workspace',
    permissions: [
      'workspace.read', 'workspace.manage',
      'tasks.read', 'tasks.write',
      'missions.read', 'missions.write',
      'documents.read', 'documents.write',
    ],
  },
  {
    name: 'member',
    scope: 'organization',
    permissions: ['organization.read', 'workspace.read', 'tasks.read', 'tasks.write', 'documents.read'],
  },
  {
    name: 'viewer',
    scope: 'organization',
    permissions: ['organization.read', 'workspace.read', 'tasks.read', 'documents.read'],
  },
]

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  sessionTtlMs: 20 * 60 * 1000,
  defaultSystemRoles: DEFAULT_SYSTEM_ROLES,
  maxTemporaryRoleDurationMs: 30 * 24 * 60 * 60 * 1000, // 30 days
}
