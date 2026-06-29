/** Every possible status a plugin may be in throughout its lifecycle. */
export type PluginStatus =
  | 'uninstalled'
  | 'installed'
  | 'initializing'
  | 'enabled'
  | 'disabled'
  | 'error'
  | 'crashed'

/** Declared capabilities that a plugin may request. */
export type PluginCapability =
  | 'chat'
  | 'voice'
  | 'calendar'
  | 'contacts'
  | 'tasks'
  | 'notifications'
  | 'maps'
  | 'documents'
  | 'email'
  | 'sms'
  | 'phone'
  | 'camera'
  | 'storage'
  | 'network'
  | 'health'
  | 'finance'
  | 'automation'
  | 'ai_access'

/** Fine-grained permissions that underpin each capability. */
export type PluginPermission =
  | 'read:tasks'
  | 'write:tasks'
  | 'read:contacts'
  | 'write:contacts'
  | 'read:calendar'
  | 'write:calendar'
  | 'read:notes'
  | 'write:notes'
  | 'notifications'
  | 'microphone'
  | 'camera'
  | 'location'
  | 'documents'
  | 'network'
  | 'filesystem'
  | 'ai_access'

/** Result shape from a plugin tool execution. */
export interface PluginToolResult {
  success: boolean
  message: string
  data?: unknown
  error?: string
}

/** Anthropic-compatible tool definition contributed by a plugin. */
export interface PluginToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

/** Health snapshot returned by plugin.healthCheck(). */
export interface PluginHealth {
  healthy: boolean
  status: PluginStatus
  lastCheckedAt: string
  responseTimeMs: number
  errorMessage?: string
}

/** Serialised plugin record persisted to Firestore (admin-level, per-plugin). */
export interface PluginRegistrationRecord {
  pluginId: string
  status: PluginStatus
  installedAt: string
  enabledAt?: string
  disabledAt?: string
  version: string
  errorMessage?: string
}
