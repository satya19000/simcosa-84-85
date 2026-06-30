import type {
  AIProviderId, ModelDescriptor, NormalizedPrompt, NormalizedResponse, NormalizedUsage,
} from './ModelTypes'

export interface ProviderHealthCheckResult {
  available: boolean
  latencyMs: number
  error?: string
}

export interface CompleteOptions {
  model: string
  debugMode?: boolean
  maxTokens?: number
}

export interface StreamChunk {
  delta: string
  done: boolean
}

/**
 * Contract every AI provider implementation must fulfil. Mirrors BaseAction's
 * role in action-engine: a closed, self-describing interface that the
 * ProviderRegistry composes against, never reimplemented downstream.
 *
 * `embed` is optional — not every provider/model supports embeddings.
 */
export interface ModelProvider {
  readonly id: AIProviderId

  initialize(): Promise<void>

  healthCheck(): Promise<ProviderHealthCheckResult>

  listModels(): ModelDescriptor[]

  complete(prompt: NormalizedPrompt, options: CompleteOptions): Promise<NormalizedResponse>

  stream(
    prompt: NormalizedPrompt,
    options: CompleteOptions,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<NormalizedResponse>

  embed?(text: string, model: string): Promise<number[]>

  estimateCost(model: string, inputTokens: number, outputTokens: number): number

  shutdown(): Promise<void>
}

export function emptyUsage(): NormalizedUsage {
  return { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 }
}
