import type { ModelProvider, ProviderHealthCheckResult, CompleteOptions, StreamChunk } from '../ModelProvider'
import type { ModelDescriptor, NormalizedPrompt, NormalizedResponse } from '../ModelTypes'
import { ModelCatalogStore } from '../ModelCatalog'

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1'

/**
 * OpenRouter provider — exposes an OpenAI-compatible chat completions API
 * that proxies many upstream model vendors. Used here primarily as a
 * fallback/aggregator option rather than a primary route.
 */
export class OpenRouterProvider implements ModelProvider {
  readonly id = 'openrouter' as const
  private readonly catalog = new ModelCatalogStore()

  constructor(private readonly apiKey: string) {}

  async initialize(): Promise<void> {}

  async healthCheck(): Promise<ProviderHealthCheckResult> {
    if (!this.apiKey) return { available: false, latencyMs: 0, error: 'No API key configured' }
    const start = Date.now()
    try {
      const res = await fetch(`${OPENROUTER_API_BASE}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      })
      if (!res.ok) return { available: false, latencyMs: Date.now() - start, error: `HTTP ${res.status}` }
      return { available: true, latencyMs: Date.now() - start }
    } catch (err) {
      return { available: false, latencyMs: Date.now() - start, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  listModels(): ModelDescriptor[] {
    return this.catalog.byProvider('openrouter')
  }

  async complete(prompt: NormalizedPrompt, options: CompleteOptions): Promise<NormalizedResponse> {
    if (!this.apiKey) throw new Error('OpenRouter provider not configured')
    const start = Date.now()

    const messages = [
      { role: 'system', content: this.buildSystemPrompt(prompt) },
      ...prompt.history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: prompt.userMessage },
    ]

    const res = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model,
        max_tokens: options.maxTokens ?? prompt.maxTokens ?? 1024,
        messages,
      }),
    })

    if (!res.ok) {
      throw new Error(`OpenRouter request failed: HTTP ${res.status}`)
    }

    const body = await res.json() as {
      choices: { message: { content: string | null }; finish_reason: string }[]
      usage?: { prompt_tokens: number; completion_tokens: number }
    }

    const latencyMs = Date.now() - start
    const choice = body.choices[0]
    const inputTokens = body.usage?.prompt_tokens ?? 0
    const outputTokens = body.usage?.completion_tokens ?? 0

    return {
      text: choice?.message.content ?? '',
      toolCalls: [],
      structuredJson: null,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        estimatedCostUsd: this.estimateCost(options.model, inputTokens, outputTokens),
      },
      provider: 'openrouter',
      model: options.model,
      latencyMs,
      finishReason: choice?.finish_reason === 'length' ? 'length' : 'stop',
      safetyFlags: [],
      ...(options.debugMode ? { raw: body } : {}),
    }
  }

  async stream(prompt: NormalizedPrompt, options: CompleteOptions, onChunk: (chunk: StreamChunk) => void): Promise<NormalizedResponse> {
    const result = await this.complete(prompt, options)
    onChunk({ delta: result.text, done: true })
    return result
  }

  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const descriptor = this.catalog.byModelId(model)
    if (!descriptor) return 0
    return (inputTokens / 1000) * descriptor.costPerKInputTokens + (outputTokens / 1000) * descriptor.costPerKOutputTokens
  }

  async shutdown(): Promise<void> {}

  private buildSystemPrompt(prompt: NormalizedPrompt): string {
    const sections = (prompt.contextSections ?? []).map((s) => `## ${s.title}\n${s.content}`)
    const memory = (prompt.memoryBlocks ?? []).map((m) => `## Memory: ${m.label}\n${m.content}`)
    return [prompt.systemPrompt, ...sections, ...memory].filter(Boolean).join('\n\n')
  }
}
