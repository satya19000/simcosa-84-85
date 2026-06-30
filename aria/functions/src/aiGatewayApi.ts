import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { getAIGateway } from './ai-gateway'
import type { ProviderApiKeys } from './ai-gateway/ProviderRegistry'
import { GatewayUserFacingError } from './ai-gateway/ModelFallbackManager'
import type { AIProviderId, ModelTaskType } from './ai-gateway/ModelTypes'
import { buildAriaSystemPrompt } from './prompts/ariaSystem'

const MAX_HISTORY = 20

function db(): admin.firestore.Firestore {
  return admin.firestore()
}

function apiKeys(): ProviderApiKeys {
  return {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
    openrouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
    localLlmEndpoint: process.env.LOCAL_LLM_ENDPOINT ?? null,
  }
}

function requireAuth(request: { auth?: { uid: string } | null }): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
  return request.auth.uid
}

function wrapEngineError<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch((err) => {
    if (err instanceof GatewayUserFacingError) throw new HttpsError('unavailable', err.message)
    const message = err instanceof Error ? err.message : 'Operation failed'
    if (message.includes('Access denied')) throw new HttpsError('permission-denied', message)
    if (message.includes('No eligible model')) throw new HttpsError('failed-precondition', 'No AI model is currently eligible for this request under the active policy/constraints.')
    throw new HttpsError('failed-precondition', message)
  })
}

const SHARED_OPTS = {
  secrets: ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY', 'OPENROUTER_API_KEY'],
  timeoutSeconds: 30,
}

// ── Discovery ────────────────────────────────────────────────────────────

export const listAIProviders = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const gateway = getAIGateway(uid, db(), apiKeys())
  return gateway.listProviders()
})

export const listAIModels = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const gateway = getAIGateway(uid, db(), apiKeys())
  return gateway.listModels()
})

export const testAIProvider = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, providerId } = request.data as { tenantId: string; providerId: AIProviderId }
  if (!tenantId || !providerId) throw new HttpsError('invalid-argument', 'tenantId and providerId required')
  const gateway = getAIGateway(uid, db(), apiKeys())
  return wrapEngineError(() => gateway.testProvider(tenantId, uid, providerId))
})

// ── Usage / policy ───────────────────────────────────────────────────────

export const getAIUsage = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, limit } = request.data as { tenantId: string; limit?: number }
  if (!tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
  const gateway = getAIGateway(uid, db(), apiKeys())
  return wrapEngineError(() => gateway.getUsage(tenantId, uid, limit))
})

export const updateModelPolicy = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, ...fields } = request.data as {
    tenantId: string
    allowedProviders?: AIProviderId[]
    blockedProviders?: AIProviderId[]
    maxMonthlySpendUsd?: number | null
    allowedTaskTypes?: ModelTaskType[] | null
    privacyRestriction?: 'standard' | 'sensitive' | 'restricted' | null
    localOnlyMode?: boolean
  }
  if (!tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
  const gateway = getAIGateway(uid, db(), apiKeys())
  return wrapEngineError(() => gateway.updatePolicy(tenantId, uid, fields))
})

// ── Gateway-routed chat (parallel to chatWithAria, feature-flagged) ───────

export interface ChatWithAriaGatewayRequest {
  message: string
  sessionId: string
  tenantId: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  taskType?: ModelTaskType
  preferredProvider?: AIProviderId | null
  preferredModel?: string | null
}

/**
 * Parallel, gateway-routed chat callable. Does NOT replace chatWithAria —
 * see chat.ts, which is untouched. This function exists so the Multi-LLM
 * Gateway can be exercised end-to-end (routing, fallback, usage tracking,
 * policy) without risking the existing Claude chat path. No Action Engine
 * tool-calling integration here yet (forward-compatible plumbing only, per
 * the phase 5.4 scope) — plain conversational completion.
 */
export const chatWithAriaGateway = onCall(
  { ...SHARED_OPTS, timeoutSeconds: 90, memory: '512MiB' as const },
  async (request: CallableRequest<ChatWithAriaGatewayRequest>) => {
    const uid = requireAuth(request)
    const { message, sessionId, tenantId, history = [], taskType, preferredProvider, preferredModel } = request.data

    if (!message?.trim()) throw new HttpsError('invalid-argument', 'Message is required.')
    if (!sessionId?.trim()) throw new HttpsError('invalid-argument', 'Session ID is required.')
    if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId is required.')

    const gateway = getAIGateway(uid, db(), apiKeys())

    if (!gateway.effectiveConfig.enableAIGateway) {
      throw new HttpsError(
        'failed-precondition',
        'AI Gateway routing is disabled (enableAIGateway=false). Use chatWithAria for the standard Claude chat path.'
      )
    }

    const authDisplayName = request.auth?.token?.name as string | undefined
    const systemPrompt = buildAriaSystemPrompt(undefined, authDisplayName)
    const trimmedHistory = history.slice(-MAX_HISTORY)

    const result = await wrapEngineError(() =>
      gateway.complete({
        tenantId,
        userId: uid,
        taskType: taskType ?? 'chat',
        systemPrompt,
        history: trimmedHistory,
        userMessage: message,
        preferredProvider: preferredProvider ?? null,
        preferredModel: preferredModel ?? null,
      })
    )

    return {
      reply: result.text,
      sessionId,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
      finishReason: result.finishReason,
    }
  }
)
