import type { ModelProvider, ProviderHealthCheckResult, CompleteOptions, StreamChunk } from '../ModelProvider'
import type { ModelDescriptor, NormalizedPrompt, NormalizedResponse } from '../ModelTypes'
import { ModelCatalogStore } from '../ModelCatalog'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

/**
 * Gemini provider via plain REST (generateContent). Mirrors OpenAIProvider's
 * shape: fully functional with a key, gracefully unavailable without one.
 */
export class GeminiProvider implements ModelProvider {
  readonly id = 'gemini' as const
  private readonly catalog = new ModelCatalogStore()

  constructor(private readonly apiKey: string) {}

  async initialize(): Promise<void> {}

  async healthCheck(): Promise<ProviderHealthCheckResult> {
    if (!this.apiKey) return { available: false, latencyMs: 0, error: 'No API key configured' }
    const start = Date.now()
    try {
      const res = await fetch(`${GEMINI_API_BASE}/models?key=${this.apiKey}`)
      if (!res.ok) return { available: false, latencyMs: Date.now() - start, error: `HTTP ${res.status}` }
      return { available: true, latencyMs: Date.now() - start }
    } catch (err) {
      return { available: false, latencyMs: Date.now() - start, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  listModels(): ModelDescriptor[] {
    return this.catalog.byProvider('gemini')
  }

  async complete(prompt: NormalizedPrompt, options: CompleteOptions): Promise<NormalizedResponse> {
    if (!this.apiKey) throw new Error('Gemini provider not configured')
    const start = Date.now()

    const contents = [
      ...prompt.history.map((h) => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
      { role: 'user', parts: [{ text: prompt.userMessage }] },
    ]

    const res = await fetch(`${GEMINI_API_BASE}/models/${options.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: this.buildSystemPrompt(prompt) }] },
        contents,
        generationConfig: { maxOutputTokens: options.maxTokens ?? prompt.maxTokens ?? 1024 },
      }),
    })

    if (!res.ok) {
      throw new Error(`Gemini request failed: HTTP ${res.status}`)
    }

    const body = await res.json() as {
      candidates?: { content: { parts: { text?: string }[] }; finishReason?: string }[]
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
    }

    const latencyMs = Date.now() - start
    const text = body.candidates?.[0]?.content.parts.map((p) => p.text ?? '').join('') ?? ''
    const inputTokens = body.usageMetadata?.promptTokenCount ?? 0
    const outputTokens = body.usageMetadata?.candidatesTokenCount ?? 0

    return {
      text,
      toolCalls: [],
      structuredJson: null,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        estimatedCostUsd: this.estimateCost(options.model, inputTokens, outputTokens),
      },
      provider: 'gemini',
      model: options.model,
      latencyMs,
      finishReason: body.candidates?.[0]?.finishReason === 'MAX_TOKENS' ? 'length' : 'stop',
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
