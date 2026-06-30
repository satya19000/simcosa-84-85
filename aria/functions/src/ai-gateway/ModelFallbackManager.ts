import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { AIProviderId, FailureClass, FallbackEventRecord, ModelDescriptor } from './ModelTypes'
import { ModelTelemetry } from './ModelTelemetry'

const FALLBACK_EVENTS_COL = (tenantId: string) => `tenants/${tenantId}/aiFallbackEvents`

/** A clean, user-safe error — never includes the raw provider error message. */
export class GatewayUserFacingError extends Error {
  constructor(message = 'The AI service is temporarily unavailable. Please try again shortly.') {
    super(message)
    this.name = 'GatewayUserFacingError'
  }
}

/**
 * Classifies provider failures and decides whether/how to fall back to the
 * next model in a RoutingDecision's fallbackChain. Never exposes a raw
 * provider error to the caller — complete()'s catch path always rethrows
 * GatewayUserFacingError (or returns a successful fallback result).
 */
export class ModelFallbackManager {
  private readonly telemetry = new ModelTelemetry()

  constructor(private readonly db: admin.firestore.Firestore) {}

  classifyFailure(error: unknown): FailureClass {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
    if (message.includes('429') || message.includes('rate limit')) return 'rate_limit'
    if (message.includes('401') || message.includes('403') || message.includes('auth') || message.includes('api key')) return 'auth'
    if (message.includes('timeout') || message.includes('etimedout') || message.includes('econnreset')) return 'timeout'
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('server error')) return 'server_error'
    if (message.includes('400') || message.includes('invalid')) return 'invalid_request'
    return 'unknown'
  }

  /** Whether this failure class is worth retrying against a fallback model at all. */
  isRetryable(failureClass: FailureClass): boolean {
    return failureClass !== 'invalid_request'
  }

  async logFallbackEvent(input: {
    tenantId: string
    userId: string
    requestId: string
    originalProvider: AIProviderId
    originalModel: string
    failureClass: FailureClass
    fallbackProvider: AIProviderId | null
    fallbackModel: string | null
    succeeded: boolean
  }): Promise<FallbackEventRecord> {
    const eventId = uuidv4()
    const record: FallbackEventRecord = {
      id: eventId,
      eventId,
      tenantId: input.tenantId,
      userId: input.userId,
      requestId: input.requestId,
      originalProvider: input.originalProvider,
      originalModel: input.originalModel,
      failureClass: input.failureClass,
      fallbackProvider: input.fallbackProvider,
      fallbackModel: input.fallbackModel,
      succeeded: input.succeeded,
      timestamp: new Date().toISOString(),
    }
    await this.db.collection(FALLBACK_EVENTS_COL(input.tenantId)).doc(eventId).set(record)
    this.telemetry.fallbackTriggered({
      tenantId: input.tenantId,
      requestId: input.requestId,
      originalProvider: input.originalProvider,
      fallbackProvider: input.fallbackProvider,
      failureClass: input.failureClass,
    })
    return record
  }

  async listFallbackEvents(tenantId: string, limit = 50): Promise<FallbackEventRecord[]> {
    const snap = await this.db
      .collection(FALLBACK_EVENTS_COL(tenantId))
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map((d) => d.data() as FallbackEventRecord)
  }

  /** Picks the next usable model from a fallback chain, excluding placeholders. */
  nextCandidate(fallbackChain: ModelDescriptor[], excludeModelIds: string[]): ModelDescriptor | null {
    return fallbackChain.find((m) => !m.isPlaceholder && !excludeModelIds.includes(m.modelId)) ?? null
  }

  toUserFacingError(): GatewayUserFacingError {
    return new GatewayUserFacingError()
  }
}
