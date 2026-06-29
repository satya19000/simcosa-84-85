/** Live metrics for a single plugin instance. Reset on each cold start. */
export interface PluginMetricsSnapshot {
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

export class PluginMetrics {
  private startupTimeMs = 0
  private executions: number[] = []
  private errors = 0
  private warnings = 0
  private apiCalls = 0
  private cacheHits = 0
  private cacheMisses = 0
  private lastExecutionAt: string | null = null
  private lastErrorAt: string | null = null
  private lastErrorMessage: string | null = null

  constructor(private readonly pluginId: string) {}

  recordStartup(ms: number): void {
    this.startupTimeMs = ms
  }

  recordExecution(ms: number): void {
    this.executions.push(ms)
    if (this.executions.length > 1000) this.executions.shift()
    this.lastExecutionAt = new Date().toISOString()
  }

  recordError(message: string): void {
    this.errors++
    this.lastErrorAt = new Date().toISOString()
    this.lastErrorMessage = message
  }

  recordWarning(): void {
    this.warnings++
  }

  recordApiCall(): void {
    this.apiCalls++
  }

  recordCacheHit(): void {
    this.cacheHits++
  }

  recordCacheMiss(): void {
    this.cacheMisses++
  }

  snapshot(): PluginMetricsSnapshot {
    const avg =
      this.executions.length > 0
        ? Math.round(this.executions.reduce((a, b) => a + b, 0) / this.executions.length)
        : 0

    const errorRate = this.executions.length > 0 ? this.errors / this.executions.length : 0
    const health: PluginMetricsSnapshot['health'] =
      errorRate > 0.5 ? 'unhealthy' : errorRate > 0.1 ? 'degraded' : 'healthy'

    return {
      pluginId: this.pluginId,
      startupTimeMs: this.startupTimeMs,
      totalExecutions: this.executions.length,
      totalErrors: this.errors,
      totalWarnings: this.warnings,
      totalApiCalls: this.apiCalls,
      avgExecutionTimeMs: avg,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      lastExecutionAt: this.lastExecutionAt,
      lastErrorAt: this.lastErrorAt,
      lastErrorMessage: this.lastErrorMessage,
      health,
    }
  }

  reset(): void {
    this.executions = []
    this.errors = 0
    this.warnings = 0
    this.apiCalls = 0
    this.cacheHits = 0
    this.cacheMisses = 0
    this.lastExecutionAt = null
    this.lastErrorAt = null
    this.lastErrorMessage = null
  }
}
