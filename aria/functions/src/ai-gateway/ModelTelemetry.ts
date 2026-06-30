import { ModelLogger } from './ModelLogger'
import type { AIProviderId, ModelTaskType, FailureClass } from './ModelTypes'

/**
 * Thin telemetry facade over ModelLogger for the specific event shapes the
 * spec calls out (provider, model, latency, tokens, cost, fallback events,
 * errors, policy denials). Keeps call sites in AIGateway/ModelRouter/
 * ModelFallbackManager declarative instead of hand-rolling log lines.
 */
export class ModelTelemetry {
  private readonly logger = new ModelLogger()

  requestCompleted(fields: {
    tenantId: string; userId: string; requestId: string; provider: AIProviderId; model: string
    taskType: ModelTaskType; latencyMs: number; inputTokens: number; outputTokens: number; estimatedCostUsd: number
  }): void {
    this.logger.info('ai_gateway.request_completed', fields)
  }

  requestFailed(fields: { tenantId: string; userId: string; requestId: string; provider: AIProviderId; model: string; errorClass: FailureClass }): void {
    this.logger.warn('ai_gateway.request_failed', fields)
  }

  fallbackTriggered(fields: {
    tenantId: string; requestId: string; originalProvider: AIProviderId; fallbackProvider: AIProviderId | null; failureClass: FailureClass
  }): void {
    this.logger.warn('ai_gateway.fallback_triggered', fields)
  }

  policyDenied(fields: { tenantId: string; userId: string; reason: string }): void {
    this.logger.warn('ai_gateway.policy_denied', fields)
  }

  healthCheckRun(fields: { tenantId: string; provider: AIProviderId; available: boolean; latencyMs: number }): void {
    this.logger.info('ai_gateway.health_check', fields)
  }
}
