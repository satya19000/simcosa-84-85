import type { AIProviderId } from './ModelTypes'
import type { ProviderHealthTracker } from './ProviderHealth'

export interface BenchmarkSample {
  provider: AIProviderId
  model: string
  latencyMs: number
  success: boolean
}

export interface BenchmarkSummary {
  provider: AIProviderId
  model: string
  sampleCount: number
  avgLatencyMs: number
  successRate: number
}

/**
 * Lightweight in-memory benchmark aggregator. Each AIGateway request can
 * feed a sample here; getSummary() rolls them up per (provider, model) for
 * the dashboard's "observed performance" view. This is intentionally
 * process-local (not persisted) — ProviderHealth is the durable source of
 * truth for routing decisions; ModelBenchmark is an inspection aid layered
 * on top, not a second source of routing truth.
 */
export class ModelBenchmark {
  private samples: BenchmarkSample[] = []
  private static readonly MAX_SAMPLES = 500

  constructor(private readonly healthTracker?: ProviderHealthTracker) {
    void this.healthTracker
  }

  record(sample: BenchmarkSample): void {
    this.samples.push(sample)
    if (this.samples.length > ModelBenchmark.MAX_SAMPLES) {
      this.samples = this.samples.slice(-ModelBenchmark.MAX_SAMPLES)
    }
  }

  getSummary(): BenchmarkSummary[] {
    const grouped = new Map<string, BenchmarkSample[]>()
    for (const sample of this.samples) {
      const key = `${sample.provider}::${sample.model}`
      const list = grouped.get(key) ?? []
      list.push(sample)
      grouped.set(key, list)
    }
    return Array.from(grouped.entries()).map(([key, samples]) => {
      const [provider, model] = key.split('::') as [AIProviderId, string]
      const avgLatencyMs = Math.round(samples.reduce((s, x) => s + x.latencyMs, 0) / samples.length)
      const successRate = samples.filter((x) => x.success).length / samples.length
      return { provider, model, sampleCount: samples.length, avgLatencyMs, successRate }
    })
  }
}
