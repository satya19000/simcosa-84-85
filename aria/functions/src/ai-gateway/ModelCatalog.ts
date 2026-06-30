import type { ModelDescriptor } from './ModelTypes'

/**
 * Hand-curated, static model catalog. Each ProviderRegistry instance asks its
 * registered providers for `listModels()` (which return slices of this
 * catalog) rather than the catalog reaching into providers directly — keeps
 * the dependency direction one-way (catalog -> providers, never reverse).
 *
 * Costs/latencies are approximate public figures as of authoring time, used
 * only for relative routing decisions and rough cost estimation — NOT a
 * live pricing feed. ModelBenchmark can refine `typicalLatencyMs` over time
 * from observed telemetry.
 */
export const MODEL_CATALOG: ModelDescriptor[] = [
  // ── Claude (Anthropic) ────────────────────────────────────────────────
  {
    modelId: 'claude-opus-4-8',
    provider: 'claude',
    displayName: 'Claude Opus 4.8',
    taskTypes: ['chat', 'reasoning', 'tool_calling', 'code_generation', 'summarization', 'extraction'],
    capabilities: ['tool_calling', 'vision', 'streaming', 'long_context'],
    qualityScore: 97,
    costPerKInputTokens: 0.015,
    costPerKOutputTokens: 0.075,
    typicalLatencyMs: 3500,
    contextWindow: 200_000,
    privacyLevel: 'standard',
    isPlaceholder: false,
  },
  {
    modelId: 'claude-haiku-4',
    provider: 'claude',
    displayName: 'Claude Haiku 4',
    taskTypes: ['chat', 'classification', 'lightweight', 'extraction', 'summarization'],
    capabilities: ['tool_calling', 'streaming'],
    qualityScore: 78,
    costPerKInputTokens: 0.0008,
    costPerKOutputTokens: 0.004,
    typicalLatencyMs: 900,
    contextWindow: 200_000,
    privacyLevel: 'standard',
    isPlaceholder: false,
  },
  // ── OpenAI ───────────────────────────────────────────────────────────
  {
    modelId: 'gpt-4o',
    provider: 'openai',
    displayName: 'GPT-4o',
    taskTypes: ['chat', 'reasoning', 'tool_calling', 'code_generation', 'vision'],
    capabilities: ['tool_calling', 'vision', 'streaming', 'json_mode'],
    qualityScore: 94,
    costPerKInputTokens: 0.005,
    costPerKOutputTokens: 0.015,
    typicalLatencyMs: 2800,
    contextWindow: 128_000,
    privacyLevel: 'standard',
    isPlaceholder: false,
  },
  {
    modelId: 'gpt-4o-mini',
    provider: 'openai',
    displayName: 'GPT-4o mini',
    taskTypes: ['chat', 'classification', 'lightweight', 'extraction'],
    capabilities: ['tool_calling', 'streaming', 'json_mode'],
    qualityScore: 75,
    costPerKInputTokens: 0.00015,
    costPerKOutputTokens: 0.0006,
    typicalLatencyMs: 800,
    contextWindow: 128_000,
    privacyLevel: 'standard',
    isPlaceholder: false,
  },
  // ── Gemini (Google) ────────────────────────────────────────────────
  {
    modelId: 'gemini-1.5-pro',
    provider: 'gemini',
    displayName: 'Gemini 1.5 Pro',
    taskTypes: ['chat', 'reasoning', 'summarization', 'vision', 'extraction'],
    capabilities: ['tool_calling', 'vision', 'streaming', 'long_context'],
    qualityScore: 90,
    costPerKInputTokens: 0.0035,
    costPerKOutputTokens: 0.0105,
    typicalLatencyMs: 2600,
    contextWindow: 1_000_000,
    privacyLevel: 'standard',
    isPlaceholder: false,
  },
  {
    modelId: 'gemini-1.5-flash',
    provider: 'gemini',
    displayName: 'Gemini 1.5 Flash',
    taskTypes: ['chat', 'classification', 'lightweight', 'summarization'],
    capabilities: ['tool_calling', 'streaming'],
    qualityScore: 73,
    costPerKInputTokens: 0.000075,
    costPerKOutputTokens: 0.0003,
    typicalLatencyMs: 700,
    contextWindow: 1_000_000,
    privacyLevel: 'standard',
    isPlaceholder: false,
  },
  // ── OpenRouter (aggregator — exposes a curated mix of upstream models) ─
  {
    modelId: 'openrouter/auto',
    provider: 'openrouter',
    displayName: 'OpenRouter Auto',
    taskTypes: ['chat', 'fallback', 'summarization'],
    capabilities: ['streaming'],
    qualityScore: 80,
    costPerKInputTokens: 0.003,
    costPerKOutputTokens: 0.009,
    typicalLatencyMs: 3000,
    contextWindow: 128_000,
    privacyLevel: 'standard',
    isPlaceholder: false,
  },
  // ── Local LLM — PLACEHOLDER ONLY, not functional ───────────────────
  {
    modelId: 'local-placeholder',
    provider: 'local',
    displayName: 'Local LLM (placeholder, not functional)',
    taskTypes: ['local', 'lightweight'],
    capabilities: [],
    qualityScore: 0,
    costPerKInputTokens: 0,
    costPerKOutputTokens: 0,
    typicalLatencyMs: 0,
    contextWindow: 0,
    privacyLevel: 'restricted',
    isPlaceholder: true,
  },
]

export class ModelCatalogStore {
  list(): ModelDescriptor[] {
    return MODEL_CATALOG
  }

  byProvider(provider: string): ModelDescriptor[] {
    return MODEL_CATALOG.filter((m) => m.provider === provider)
  }

  byModelId(modelId: string): ModelDescriptor | null {
    return MODEL_CATALOG.find((m) => m.modelId === modelId) ?? null
  }

  byTaskType(taskType: string): ModelDescriptor[] {
    return MODEL_CATALOG.filter((m) => m.taskTypes.includes(taskType as never))
  }
}
