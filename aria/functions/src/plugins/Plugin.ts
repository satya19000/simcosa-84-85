import type { PluginManifest } from './PluginManifest'
import type { PluginContext } from './PluginContext'
import type { PluginHealth, PluginToolDefinition, PluginToolResult } from './PluginTypes'
import type { MemoryProvider } from '../intelligence/MemoryTypes'

/**
 * The contract every ARIA plugin must implement.
 * Lifecycle: install → initialize → enable → [disable → enable]* → shutdown
 */
export interface ARIAPlugin {
  readonly manifest: PluginManifest

  /** Called once when first installed. Run schema setup, default config writes, etc. */
  install(ctx: PluginContext): Promise<void>

  /** Called at runtime startup (after install). Set up event subscriptions here. */
  initialize(ctx: PluginContext): Promise<void>

  /** Called when plugin is activated. Begin normal operation. */
  enable(): Promise<void>

  /** Called when plugin is suspended. Stop active operations but retain state. */
  disable(): Promise<void>

  /** Called when upgrading. Receive the previous version string. */
  upgrade(previousVersion: string, ctx: PluginContext): Promise<void>

  /** Called before Cloud Function shutdown. Clean up timers, connections. */
  shutdown(): Promise<void>

  /** Must return a result within 5s. Used by runtime to detect failures. */
  healthCheck(): Promise<PluginHealth>

  /** Optional: Tool definitions this plugin contributes to Claude's tool set. */
  getToolDefinitions?(): PluginToolDefinition[]

  /** Optional: Execute a tool this plugin owns. Only called by PluginRuntime. */
  executeTool?(
    toolName: string,
    args: Record<string, unknown>,
    ctx: PluginContext
  ): Promise<PluginToolResult>

  /** Optional: Memory providers this plugin registers with the Intelligence Layer. */
  getMemoryProviders?(): MemoryProvider[]
}
