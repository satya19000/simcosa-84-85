import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'

export interface PluginHealthItem {
  id: string
  name: string
  status: string
  health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  lastErrorMessage: string | null
}

export interface PluginRuntimeHealth {
  totalPlugins: number
  enabledPlugins: number
  errorPlugins: number
  plugins: PluginHealthItem[]
}

export interface PluginMetricsItem {
  pluginId: string
  startupTimeMs: number
  totalExecutions: number
  totalErrors: number
  totalWarnings: number
  totalApiCalls: number
  avgExecutionTimeMs: number
  cacheHits: number
  cacheMisses: number
  lastExecutionAt: string | null
  lastErrorAt: string | null
  lastErrorMessage: string | null
  health: 'healthy' | 'degraded' | 'unhealthy'
}

export interface PluginStatusResult {
  health: PluginRuntimeHealth
  metrics: PluginMetricsItem[]
}

const getPluginStatusFn = httpsCallable<void, PluginStatusResult>(functions, 'getPluginStatus')

export async function fetchPluginStatus(): Promise<PluginStatusResult> {
  const result = await getPluginStatusFn()
  return result.data
}
