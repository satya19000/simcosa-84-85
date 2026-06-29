import type * as admin from 'firebase-admin'
import type { ARIAPlugin } from './Plugin'
import type { PluginContext } from './PluginContext'
import type { PluginToolDefinition, PluginToolResult, PluginRegistrationRecord } from './PluginTypes'
import type { MemoryProvider } from '../intelligence/MemoryTypes'
import { PluginRegistry } from './PluginRegistry'
import { PluginLoader } from './PluginLoader'
import { PluginLogger } from './PluginLogger'
import { PluginMetrics } from './PluginMetrics'
import { PluginConfig } from './PluginConfig'
import { PermissionManager } from './PluginPermissions'
import { CapabilityManager } from './CapabilityManager'
import { pluginEventBus } from './PluginEvents'
import { buildPluginContext } from './PluginContext'

export interface PluginRuntimeHealthEntry {
  id: string
  name: string
  status: PluginRegistrationRecord['status']
  healthy: boolean | null
  lastErrorMessage: string | null
}

export interface RuntimeHealth {
  totalPlugins: number
  enabledPlugins: number
  errorPlugins: number
  plugins: PluginRuntimeHealthEntry[]
}

export class PluginRuntime {
  private readonly registry = new PluginRegistry()
  private readonly runtimeLogger = new PluginLogger('plugin-runtime')
  private readonly loader: PluginLoader
  private readonly metricsMap = new Map<string, PluginMetrics>()
  private readonly loggersMap = new Map<string, PluginLogger>()
  private healthCache = new Map<string, { healthy: boolean; checkedAt: number }>()

  constructor(private readonly db: admin.firestore.Firestore) {
    this.loader = new PluginLoader(this.registry, this.runtimeLogger)
  }

  private buildContext(pluginId: string, userId: string): PluginContext {
    const logger = this.loggersMap.get(pluginId) ?? new PluginLogger(pluginId)
    this.loggersMap.set(pluginId, logger)

    const metrics = this.metricsMap.get(pluginId) ?? new PluginMetrics(pluginId)
    this.metricsMap.set(pluginId, metrics)

    const config = new PluginConfig(pluginId, this.db)
    const permissionManager = new PermissionManager()
    const plugin = this.registry.get(pluginId)
    if (plugin) {
      permissionManager.grantForCapabilities(pluginId, plugin.manifest.capabilities)
    }
    const capabilities = new CapabilityManager(permissionManager)

    return buildPluginContext(pluginId, userId, this.db, logger, pluginEventBus, config, metrics, capabilities)
  }

  async loadPlugin(plugin: ARIAPlugin, userId: string): Promise<void> {
    const { id } = plugin.manifest
    const start = Date.now()

    const ctx = this.buildContext(id, userId)
    await this.loader.install(plugin, ctx)
    await this.loader.initialize(id, ctx)
    await this.loader.enable(id)

    this.metricsMap.get(id)?.recordStartup(Date.now() - start)
    await pluginEventBus.emit('plugin:enabled', id, { pluginId: id }, userId)
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    await this.loader.disable(pluginId)
    await this.loader.shutdown(pluginId)
    await pluginEventBus.emit('plugin:disabled', pluginId, { pluginId })
  }

  async restartPlugin(pluginId: string, userId: string): Promise<void> {
    const plugin = this.registry.get(pluginId)
    if (!plugin) throw new Error(`Plugin "${pluginId}" not found`)
    await this.unloadPlugin(pluginId)
    this.registry.unregister(pluginId)
    await this.loadPlugin(plugin, userId)
  }

  async recoverFailed(userId: string): Promise<void> {
    const failed = this.registry.listPlugins().filter((r) => r.status === 'error')
    for (const record of failed) {
      try {
        this.runtimeLogger.warn(`Recovering failed plugin "${record.pluginId}"`)
        await this.restartPlugin(record.pluginId, userId)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        this.runtimeLogger.error(`Recovery failed for "${record.pluginId}": ${msg}`)
        await pluginEventBus.emit('plugin:error', record.pluginId, { pluginId: record.pluginId, error: msg })
      }
    }
  }

  async getHealth(userId: string): Promise<RuntimeHealth> {
    const records = this.registry.listPlugins()

    const pluginItems = await Promise.all(
      records.map(async (record): Promise<PluginRuntimeHealthEntry> => {
        if (record.status !== 'enabled') {
          return {
            id: record.pluginId,
            name: this.registry.get(record.pluginId)?.manifest.name ?? record.pluginId,
            status: record.status,
            healthy: null,
            lastErrorMessage: record.errorMessage ?? null,
          }
        }

        const cached = this.healthCache.get(record.pluginId)
        if (cached && Date.now() - cached.checkedAt < 30_000) {
          return {
            id: record.pluginId,
            name: this.registry.get(record.pluginId)?.manifest.name ?? record.pluginId,
            status: record.status,
            healthy: cached.healthy,
            lastErrorMessage: record.errorMessage ?? null,
          }
        }

        try {
          const plugin = this.registry.get(record.pluginId)!
          const result = await Promise.race([
            plugin.healthCheck(),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
          ])
          this.healthCache.set(record.pluginId, { healthy: result.healthy, checkedAt: Date.now() })
          return {
            id: record.pluginId,
            name: plugin.manifest.name,
            status: record.status,
            healthy: result.healthy,
            lastErrorMessage: record.errorMessage ?? null,
          }
        } catch {
          this.healthCache.set(record.pluginId, { healthy: false, checkedAt: Date.now() })
          return {
            id: record.pluginId,
            name: this.registry.get(record.pluginId)?.manifest.name ?? record.pluginId,
            status: record.status,
            healthy: false,
            lastErrorMessage: record.errorMessage ?? null,
          }
        }
      })
    )

    return {
      totalPlugins: records.length,
      enabledPlugins: records.filter((r) => r.status === 'enabled').length,
      errorPlugins: records.filter((r) => r.status === 'error').length,
      plugins: pluginItems,
    }
  }

  getAllToolDefinitions(): PluginToolDefinition[] {
    const tools: PluginToolDefinition[] = []
    for (const plugin of this.registry.listEnabled()) {
      if (plugin.getToolDefinitions) {
        tools.push(...plugin.getToolDefinitions())
      }
    }
    return tools
  }

  async executeTool(toolName: string, args: Record<string, unknown>, userId: string): Promise<PluginToolResult> {
    for (const plugin of this.registry.listEnabled()) {
      const defs = plugin.getToolDefinitions?.() ?? []
      if (defs.some((d) => d.name === toolName)) {
        if (!plugin.executeTool) {
          return { success: false, message: `Plugin "${plugin.manifest.id}" does not implement executeTool`, error: 'not_implemented' }
        }
        const ctx = this.buildContext(plugin.manifest.id, userId)
        const metrics = this.metricsMap.get(plugin.manifest.id)
        const start = Date.now()
        try {
          const result = await plugin.executeTool(toolName, args, ctx)
          metrics?.recordExecution(Date.now() - start)
          metrics?.recordApiCall()
          return result
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          metrics?.recordError(msg)
          return { success: false, message: msg, error: msg }
        }
      }
    }
    return { success: false, message: `No plugin found for tool "${toolName}"`, error: 'not_found' }
  }

  getAllMemoryProviders(): MemoryProvider[] {
    const providers: MemoryProvider[] = []
    for (const plugin of this.registry.listEnabled()) {
      if (plugin.getMemoryProviders) {
        providers.push(...plugin.getMemoryProviders())
      }
    }
    return providers
  }

  getMetrics(pluginId: string) {
    return this.metricsMap.get(pluginId)?.snapshot() ?? null
  }

  getAllMetrics() {
    return Array.from(this.metricsMap.entries()).map(([, m]) => m.snapshot())
  }

  listPlugins() {
    return this.registry.listPlugins()
  }

  searchPlugins(query: string) {
    return this.registry.searchPlugins(query)
  }
}
