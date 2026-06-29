import type { PluginCapability, PluginPermission } from './PluginTypes'

/** Authoritative mapping: capability → minimum required permissions. */
export const CAPABILITY_PERMISSIONS: Record<PluginCapability, PluginPermission[]> = {
  chat: ['ai_access'],
  voice: ['microphone', 'ai_access'],
  calendar: ['read:calendar'],
  contacts: ['read:contacts'],
  tasks: ['read:tasks'],
  notifications: ['notifications'],
  maps: ['location', 'network'],
  documents: ['documents'],
  email: ['network', 'read:contacts'],
  sms: ['network'],
  phone: ['network'],
  camera: ['camera'],
  storage: ['read:notes', 'write:notes'],
  network: ['network'],
  health: ['filesystem'],
  finance: ['filesystem'],
  automation: ['ai_access', 'write:tasks'],
  ai_access: ['ai_access'],
}

export interface PermissionGrant {
  permission: PluginPermission
  granted: boolean
  grantedAt?: string
  revokedAt?: string
  reason?: string
}

/**
 * Tracks which permissions have been granted or denied for each plugin.
 * Held in-memory by PluginRuntime — no plugin may bypass this.
 */
export class PermissionManager {
  private grants = new Map<string, Map<PluginPermission, PermissionGrant>>()

  /** Auto-grant all permissions implied by the plugin's declared capabilities. */
  grantForCapabilities(pluginId: string, capabilities: PluginCapability[]): void {
    const required = new Set<PluginPermission>()
    for (const cap of capabilities) {
      for (const perm of CAPABILITY_PERMISSIONS[cap] ?? []) {
        required.add(perm)
      }
    }
    const pluginGrants = this.grants.get(pluginId) ?? new Map<PluginPermission, PermissionGrant>()
    const now = new Date().toISOString()
    for (const perm of required) {
      pluginGrants.set(perm, { permission: perm, granted: true, grantedAt: now })
    }
    this.grants.set(pluginId, pluginGrants)
  }

  grant(pluginId: string, permission: PluginPermission, reason?: string): void {
    const pluginGrants = this.grants.get(pluginId) ?? new Map<PluginPermission, PermissionGrant>()
    pluginGrants.set(permission, {
      permission,
      granted: true,
      grantedAt: new Date().toISOString(),
      reason,
    })
    this.grants.set(pluginId, pluginGrants)
  }

  revoke(pluginId: string, permission: PluginPermission, reason?: string): void {
    const existing = this.grants.get(pluginId)?.get(permission)
    if (existing) {
      const pluginGrants = this.grants.get(pluginId)!
      pluginGrants.set(permission, {
        ...existing,
        granted: false,
        revokedAt: new Date().toISOString(),
        reason,
      })
    }
  }

  has(pluginId: string, permission: PluginPermission): boolean {
    return this.grants.get(pluginId)?.get(permission)?.granted === true
  }

  getGrants(pluginId: string): PermissionGrant[] {
    return Array.from(this.grants.get(pluginId)?.values() ?? [])
  }

  clear(pluginId: string): void {
    this.grants.delete(pluginId)
  }
}
