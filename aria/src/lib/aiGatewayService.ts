import { httpsCallable } from 'firebase/functions'
import { functions as fns } from './firebase'

const listAIProvidersFn = httpsCallable(fns, 'listAIProviders')
const listAIModelsFn = httpsCallable(fns, 'listAIModels')
const testAIProviderFn = httpsCallable(fns, 'testAIProvider')
const getAIUsageFn = httpsCallable(fns, 'getAIUsage')
const updateModelPolicyFn = httpsCallable(fns, 'updateModelPolicy')
const chatWithAriaGatewayFn = httpsCallable(fns, 'chatWithAriaGateway')

// ── Shared types (mirrors aria/functions/src/ai-gateway/ModelTypes.ts) ──────

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
export type ModelCapability = 'tool_calling' | 'vision' | 'audio' | 'embedding' | 'streaming' | 'json_mode' | 'long_context'
export type CircuitBreakerStatus = 'closed' | 'open' | 'half_open'
export type FailureClass = 'rate_limit' | 'auth' | 'timeout' | 'server_error' | 'invalid_request' | 'unknown'

export interface ModelDescriptor {
  modelId: string
  provider: AIProviderId
  displayName: string
  taskTypes: ModelTaskType[]
  capabilities: ModelCapability[]
  qualityScore: number
  costPerKInputTokens: number
  costPerKOutputTokens: number
  typicalLatencyMs: number
  contextWindow: number
  privacyLevel: PrivacyLevel
  /** True only for the LocalLLMProvider placeholder — never functional today. */
  isPlaceholder: boolean
}

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

export interface AIPolicyRecord {
  id: string
  policyId: string
  tenantId: string
  allowedProviders: AIProviderId[]
  blockedProviders: AIProviderId[]
  maxMonthlySpendUsd: number | null
  allowedTaskTypes: ModelTaskType[] | null
  privacyRestriction: PrivacyLevel | null
  /** PLACEHOLDER ONLY — cannot be enforced until LocalLLMProvider is functional. */
  localOnlyMode: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ChatWithAriaGatewayResult {
  reply: string
  sessionId: string
  provider: AIProviderId
  model: string
  usage: { inputTokens: number; outputTokens: number; totalTokens: number; estimatedCostUsd: number }
  finishReason: string
}

// ── Discovery ────────────────────────────────────────────────────────────────

export async function listAIProviders(): Promise<AIProviderId[]> {
  const result = await listAIProvidersFn()
  return result.data as AIProviderId[]
}

export async function listAIModels(): Promise<ModelDescriptor[]> {
  const result = await listAIModelsFn()
  return result.data as ModelDescriptor[]
}

export async function testAIProvider(tenantId: string, providerId: AIProviderId): Promise<ProviderHealthRecord> {
  const result = await testAIProviderFn({ tenantId, providerId })
  return result.data as ProviderHealthRecord
}

// ── Usage / policy ─────────────────────────────────────────────────────────

export async function getAIUsage(tenantId: string, limit = 100): Promise<AIUsageRecord[]> {
  const result = await getAIUsageFn({ tenantId, limit })
  return result.data as AIUsageRecord[]
}

export async function updateModelPolicy(tenantId: string, fields: Partial<Pick<AIPolicyRecord,
  'allowedProviders' | 'blockedProviders' | 'maxMonthlySpendUsd' | 'allowedTaskTypes' | 'privacyRestriction' | 'localOnlyMode'
>>): Promise<AIPolicyRecord> {
  const result = await updateModelPolicyFn({ tenantId, ...fields })
  return result.data as AIPolicyRecord
}

// ── Gateway-routed chat (parallel to chatWithAria; feature-flagged server-side) ─

export async function chatWithAriaGateway(input: {
  message: string
  sessionId: string
  tenantId: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  taskType?: ModelTaskType
  preferredProvider?: AIProviderId | null
  preferredModel?: string | null
}): Promise<ChatWithAriaGatewayResult> {
  const result = await chatWithAriaGatewayFn(input)
  return result.data as ChatWithAriaGatewayResult
}
