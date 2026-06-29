import type { PluginCapability } from './PluginTypes'
import { CAPABILITY_PERMISSIONS, type PermissionManager } from './PluginPermissions'

/**
 * Wraps PermissionManager with capability-level checks.
 * Plugins interact through capabilities; permissions are implementation detail.
 */
export class CapabilityManager {
  constructor(private readonly permissions: PermissionManager) {}

  hasCapability(pluginId: string, capability: PluginCapability): boolean {
    const required = CAPABILITY_PERMISSIONS[capability] ?? []
    return required.every((perm) => this.permissions.has(pluginId, perm))
  }

  /** Throws if the plugin lacks the required capability. Use inside plugin handlers. */
  requireCapability(pluginId: string, capability: PluginCapability): void {
    if (!this.hasCapability(pluginId, capability)) {
      throw new Error(
        `Plugin "${pluginId}" does not have capability "${capability}". ` +
        `Declare it in your manifest and ensure permissions are granted.`
      )
    }
  }

  listGrantedCapabilities(pluginId: string): PluginCapability[] {
    const allCapabilities = Object.keys(CAPABILITY_PERMISSIONS) as PluginCapability[]
    return allCapabilities.filter((cap) => this.hasCapability(pluginId, cap))
  }
}
