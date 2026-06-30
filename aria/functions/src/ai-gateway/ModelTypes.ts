// ── Provider model ────────────────────────────────────────────────────────

export type AIProviderId = 'claude' | 'openai' | 'gemini' | 'openrouter' | 'local'

export const AI_PROVIDER_IDS: AIProviderId[] = ['claude', 'openai', 'gemini', 'openrouter', 'local']

export type ModelTaskType =
  | 'chat' | 'reasoning' | 'summarization' | 'tool_calling' | 'code_generation'
  | 'classification' | 'extraction' | 'embedding' | 'vision' | 'audio'
  | 'lightweight' | 'local' | 'fallback'

export const MODEL_TASK_TYPES: ModelTaskType[] = [
  'chat', 'reasoning', 'summarization', 'tool_calling', 'code_generation',
  'classification', 'extraction', 'embedding', 'vision', 'audio',
  'lightweight', 'local', 'fallback',
]

export type PrivacyLevel = 'standard' | 'sensitive' | 'restricted'

/** Closed vocabulary of model capabilities a provider/model may declare. */
export type ModelCapability =
  | 'tool_calling' | 'vision' | 'audio' | 'embedding' | 'streaming' | 'json_mode' | 'long_context'

export interface ModelDescriptor {
  modelId: string
  provider: AIProviderId
  displayName: string
  taskTypes: ModelTaskType[]
  capabilities: ModelCapability[]
  /** Relative 0-100 quality score, hand-curated — not a live benchmark. */
  qualityScore: number
  /** USD per 1K input/output tokens — approximate, for cost estimation only. */
  costPerKInputTokens: number
  costPerKOutputTokens: number
  /** Approximate typical latency bucket in ms — heuristic, not measured live unless ModelBenchmark has run. */
  typicalLatencyMs: number
  contextWindow: number
  privacyLevel: PrivacyLevel
  /** True only for the LocalLLMProvider placeholder — never functional today. */
  isPlaceholder: boolean
}

// ── Normalized prompt format (ARIA-internal, provider-agnostic) ────────────

export interface NormalizedMemoryBlock {
  label: string
  content: string
}

export interface NormalizedToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export interface NormalizedToolResult {
  toolCallId: string
  toolName: string
  content: string
  isError?: boolean
}

export interface NormalizedMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface NormalizedPrompt {
  systemPrompt: string
  /** Optional structured context sections appended to the system prompt (e.g. profile, recent activity). */
  contextSections?: { title: string; content: string }[]
  memoryBlocks?: NormalizedMemoryBlock[]
  history: NormalizedMessage[]
  userMessage: string
  tools?: NormalizedToolDefinition[]
  /** Tool results to attach when continuing a tool-use turn. */
  pendingToolResults?: NormalizedToolResult[]
  /** Hint that the caller wants structured JSON output, with an optional schema description. */
  structuredOutputHint?: { description: string; schema?: Record<string, unknown> } | null
  maxTokens?: number
}

// ── Normalized response format ──────────────────────────────────────────────

export interface NormalizedToolCall {
  toolName: string
  arguments: Record<string, unknown>
  id: string
  confidence?: number
}

export type FinishReason = 'stop' | 'tool_use' | 'length' | 'content_filter' | 'error'

export interface NormalizedUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCostUsd: number
}

export interface NormalizedResponse {
  text: string
  toolCalls: NormalizedToolCall[]
  structuredJson: unknown | null
  usage: NormalizedUsage
  provider: AIProviderId
  model: string
  latencyMs: number
  finishReason: FinishReason
  safetyFlags: string[]
  /** Only populated when an explicit debug mode is enabled — raw provider payload. */
  raw?: unknown
}

// ── Routing ──────────────────────────────────────────────────────────────────

export interface RoutingRequest {
  taskType: ModelTaskType
  tenantId?: string | null
  userId: string
  requiredCapabilities?: ModelCapability[]
  maxCostUsd?: number
  maxLatencyMs?: number
  privacyLevel?: PrivacyLevel
  preferredProvider?: AIProviderId | null
  preferredModel?: string | null
}

export interface RoutingDecision {
  model: ModelDescriptor
  reason: string
  fallbackChain: ModelDescriptor[]
}

// ── Cost & usage tracking ────────────────────────────────────────────────────

export interface AIUsageRecord {
  id: string
  usageId: string
  tenantId: string
  userId: string
  requestId: string
  provider: AIProviderId
  model: string
  taskType: ModelTaskType
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
  latencyMs: number
  success: boolean
  fallbackUsed: boolean
  timestamp: string
}

// ── Provider health ──────────────────────────────────────────────────────────

export type CircuitBreakerStatus = 'closed' | 'open' | 'half_open'

export interface ProviderHealthRecord {
  id: string
  providerId: AIProviderId
  tenantId: string
  avgLatencyMs: number
  failureRate: number
  lastErrorType: string | null
  lastSuccessAt: string | null
  lastFailureAt: string | null
  available: boolean
  circuitBreakerStatus: CircuitBreakerStatus
  consecutiveFailures: number
  updatedAt: string
}

// ── Fallback ───────────────────────────────────────────────────────────────

export type FailureClass = 'rate_limit' | 'auth' | 'timeout' | 'server_error' | 'invalid_request' | 'unknown'

export interface FallbackEventRecord {
  id: string
  eventId: string
  tenantId: string
  userId: string
  requestId: string
  originalProvider: AIProviderId
  originalModel: string
  failureClass: FailureClass
  fallbackProvider: AIProviderId | null
  fallbackModel: string | null
  succeeded: boolean
  timestamp: string
}

// ── Policy ────────────────────────────────────────────────────────────────

export interface AIPolicyRecord {
  id: string
  policyId: string
  tenantId: string
  allowedProviders: AIProviderId[]
  blockedProviders: AIProviderId[]
  maxMonthlySpendUsd: number | null
  allowedTaskTypes: ModelTaskType[] | null
  privacyRestriction: PrivacyLevel | null
  /** PLACEHOLDER ONLY — local-only mode cannot be enforced until LocalLLMProvider is functional. */
  localOnlyMode: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}
