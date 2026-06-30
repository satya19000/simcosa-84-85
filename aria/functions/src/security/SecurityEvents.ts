/**
 * Closed vocabulary of security event names used when calling
 * SecurityAudit.record(). Centralizing the strings here avoids typos
 * scattering inconsistent action names across action handlers and
 * SecurityEngine methods. Mirrors the style of WorkspaceEvents.ts.
 */
export const SecurityEventType = {
  TENANT_CREATED: 'tenant_created',
  IDENTITY_CREATED: 'identity_created',
  IDENTITY_STATUS_CHANGED: 'identity_status_changed',
  ROLE_CREATED: 'role_created',
  ROLE_UPDATED: 'role_updated',
  ROLE_ASSIGNED: 'role_assigned',
  ROLE_REVOKED: 'role_revoked',
  PERMISSION_CHANGED: 'permission_changed',
  MEMBER_REMOVED: 'member_removed',
  POLICY_CREATED: 'policy_created',
  POLICY_UPDATED: 'policy_updated',
  SESSION_CREATED: 'session_created',
  SESSION_REVOKED: 'session_revoked',
  SERVICE_ACCOUNT_CREATED: 'service_account_created',
  PLUGIN_INSTALLED: 'plugin_installed',
  EXPORT_REQUESTED: 'export_requested',
  GROUP_CREATED: 'group_created',
  GROUP_MEMBER_ADDED: 'group_member_added',
  GROUP_MEMBER_REMOVED: 'group_member_removed',
  GROUP_ROLE_ASSIGNED: 'group_role_assigned',
} as const

export type SecurityEventName = typeof SecurityEventType[keyof typeof SecurityEventType]
