export interface AgentMetricsSnapshot {
  agentId: string
  totalTasks: number
  successfulTasks: number
  failedTasks: number
  retryCount: number
  totalDurationMs: number
  avgLatencyMs: number
  cacheHits: number
  cacheMisses: number
  tokenUsageInput: number
  tokenUsageOutput: number
  peakConcurrency: number
  lastTaskAt: string | null
  lastErrorAt: string | null
  lastErrorMessage: string | null
  successRate: number
}

export class AgentMetrics {
  private totalTasks = 0
  private successfulTasks = 0
  private failedTasks = 0
  private retryCount = 0
  private durations: number[] = []
  private cacheHits = 0
  private cacheMisses = 0
  private tokenInput = 0
  private tokenOutput = 0
  private peakConcurrency = 0
  private currentConcurrency = 0
  private lastTaskAt: string | null = null
  private lastErrorAt: string | null = null
  private lastErrorMessage: string | null = null

  constructor(private readonly agentId: string) {}

  recordTaskStart(): void {
    this.totalTasks++
    this.currentConcurrency++
    if (this.currentConcurrency > this.peakConcurrency) {
      this.peakConcurrency = this.currentConcurrency
    }
    this.lastTaskAt = new Date().toISOString()
  }

  recordTaskEnd(durationMs: number, success: boolean): void {
    this.currentConcurrency = Math.max(0, this.currentConcurrency - 1)
    this.durations.push(durationMs)
    if (this.durations.length > 500) this.durations.shift()
    if (success) this.successfulTasks++
    else this.failedTasks++
  }

  recordRetry(): void { this.retryCount++ }
  recordCacheHit(): void { this.cacheHits++ }
  recordCacheMiss(): void { this.cacheMisses++ }
  recordTokens(input: number, output: number): void {
    this.tokenInput += input
    this.tokenOutput += output
  }
  recordError(message: string): void {
    this.lastErrorAt = new Date().toISOString()
    this.lastErrorMessage = message
  }

  snapshot(): AgentMetricsSnapshot {
    const totalDuration = this.durations.reduce((a, b) => a + b, 0)
    const avg = this.durations.length > 0 ? Math.round(totalDuration / this.durations.length) : 0
    const successRate = this.totalTasks > 0 ? this.successfulTasks / this.totalTasks : 1
    return {
      agentId: this.agentId,
      totalTasks: this.totalTasks,
      successfulTasks: this.successfulTasks,
      failedTasks: this.failedTasks,
      retryCount: this.retryCount,
      totalDurationMs: totalDuration,
      avgLatencyMs: avg,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      tokenUsageInput: this.tokenInput,
      tokenUsageOutput: this.tokenOutput,
      peakConcurrency: this.peakConcurrency,
      lastTaskAt: this.lastTaskAt,
      lastErrorAt: this.lastErrorAt,
      lastErrorMessage: this.lastErrorMessage,
      successRate,
    }
  }
}
