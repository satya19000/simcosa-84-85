import type { ARIAPlugin } from './Plugin'
import type { PluginRegistrationRecord } from './PluginTypes'

export class PluginRegistry {
  private plugins = new Map<string, ARIAPlugin>()
  private records = new Map<string, PluginRegistrationRecord>()

  register(plugin: ARIAPlugin): void {
    const { id } = plugin.manifest
    if (this.plugins.has(id)) {
      throw new Error(`Plugin "${id}" is already registered`)
    }
    this.plugins.set(id, plugin)
    this.records.set(id, {
      pluginId: id,
      status: 'installed',
      installedAt: new Date().toISOString(),
      version: plugin.manifest.version,
    })
  }

  unregister(pluginId: string): void {
    if (!this.plugins.has(pluginId)) {
      throw new Error(`Plugin "${pluginId}" is not registered`)
    }
    this.plugins.delete(pluginId)
    this.records.delete(pluginId)
  }

  get(pluginId: string): ARIAPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  getRecord(pluginId: string): PluginRegistrationRecord | undefined {
    return this.records.get(pluginId)
  }

  setStatus(pluginId: string, status: PluginRegistrationRecord['status'], error?: string): void {
    const record = this.records.get(pluginId)
    if (!record) return
    record.status = status
    if (status === 'enabled') record.enabledAt = new Date().toISOString()
    if (status === 'disabled') record.disabledAt = new Date().toISOString()
    if (error) record.errorMessage = error
  }

  listPlugins(): PluginRegistrationRecord[] {
    return Array.from(this.records.values())
  }

  listEnabled(): ARIAPlugin[] {
    return Array.from(this.records.values())
      .filter((r) => r.status === 'enabled')
      .map((r) => this.plugins.get(r.pluginId))
      .filter((p): p is ARIAPlugin => p !== undefined)
  }

  searchPlugins(query: string): PluginRegistrationRecord[] {
    const q = query.toLowerCase()
    return this.listPlugins().filter((r) => {
      const plugin = this.plugins.get(r.pluginId)
      if (!plugin) return false
      return (
        plugin.manifest.name.toLowerCase().includes(q) ||
        plugin.manifest.description.toLowerCase().includes(q) ||
        plugin.manifest.capabilities.some((c) => c.toLowerCase().includes(q))
      )
    })
  }

  has(pluginId: string): boolean {
    return this.plugins.has(pluginId)
  }

  size(): number {
    return this.plugins.size
  }
}
