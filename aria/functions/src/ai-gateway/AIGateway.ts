import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { TenantEngine } from '../security/TenantEngine'
import type { RBACEngine } from '../security/RBACEngine'
import { ProviderRegistry, type ProviderApiKeys } from './ProviderRegistry'
import { ProviderHealthTracker } from './ProviderHealth'
import { ModelPolicyEngine } from './ModelPolicyEngine'
import { ModelPermissions } from './ModelPermissions'
import { ModelUsageTracker } from './ModelUsageTracker'
import { ModelRouter } from './ModelRouter'
import { ModelFallbackManager } from './ModelFallbackManager'
import { ModelBenchmark } from './ModelBenchmark'
import { ModelCostEstimator } from './ModelCostEstimator'
import { ModelCatalogStore } from './ModelCatalog'
import { PromptNormalizer, type BuildPromptInput } from './PromptNormalizer'
import { ResponseNormalizer } from './ResponseNormalizer'
import { ModelTelemetry } from './ModelTelemetry'
import type { AIGatewayConfig } from './ModelConfig'
import type {
  ModelTaskType, NormalizedResponse, RoutingRequest, AIProviderId, ModelDescriptor,
} from './ModelTypes'

export interface GatewayCompleteInput extends BuildPromptInput {
  tenantId: string
  userId: string
  taskType: ModelTaskType
  requiredCapabilities?: RoutingRequest['requiredCapabilities']
  maxCostUsd?: number
  maxLatencyMs?: number
  privacyLevel?: RoutingRequest['privacyLevel']
  preferredProvider?: AIProviderId | null
  preferredModel?: string | null
}

/**
 * Top-level facade for the Multi-LLM Gateway — the ai-gateway-module
 * equivalent of MarketplaceEngine/SecurityEngine. Composes ProviderRegistry,
 * ModelRouter, ModelPolicyEngine, ModelFallbackManager, ModelUsageTracker,
 * and the normalizers. This is the ONLY class aiGatewayApi.ts and any
 * forward-compatible agent adapter should talk to.
 */
export class AIGateway {
  readonly registry: ProviderRegistry
  readonly health: ProviderHealthTracker
  readonly policy: ModelPolicyEngine
  readonly router: ModelRouter
  readonly fallback: ModelFallbackManager
  readonly usage: ModelUsageTracker
  readonly benchmark = new ModelBenchmark()
  readonly catalog = new ModelCatalogStore()
  private readonly costEstimator = new ModelCostEstimator()
  private readonly promptNormalizer = new PromptNormalizer()
  private readonly responseNormalizer = new ResponseNormalizer()
  private readonly telemetry = new ModelTelemetry()
  private readonly permissions: ModelPermissions

  constructor(
    db: admin.firestore.Firestore,
    private readonly config: AIGatewayConfig,
    apiKeys: ProviderApiKeys,
    private readonly tenants: TenantEngine,
    rbac: RBACEngine
  ) {
    this.registry = new ProviderRegistry(apiKeys)
    this.health = new ProviderHealthTracker(db, this.registry)
    this.permissions = new ModelPermissions(rbac)
    this.usage = new ModelUsageTracker(db)
    this.policy = new ModelPolicyEngine(db, tenants, this.permissions, this.usage)
    this.router = new ModelRouter(this.health, this.policy)
    this.fallback = new ModelFallbackManager(db)
  }

  get effectiveConfig(): AIGatewayConfig {
    return this.config
  }

  // ── Discovery ─────────────────────────────────────────────────────────

  listProviders(): AIProviderId[] {
    return this.registry.ids()
  }

  listModels(): ModelDescriptor[] {
    return this.catalog.list()
  }

  async testProvider(tenantId: string, actorUserId: string, providerId: AIProviderId) {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const result = await this.health.runHealthCheck(tenantId, providerId)
    this.telemetry.healthCheckRun({ tenantId, provider: providerId, available: result.available, latencyMs: result.avgLatencyMs })
    return result
  }

  async listProviderHealth(tenantId: string, actorUserId: string) {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    return this.health.listRecords(tenantId)
  }

  async getUsage(tenantId: string, actorUserId: string, limit?: number) {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    return this.usage.listRecent(tenantId, limit)
  }

  async getPolicy(tenantId: string, actorUserId: string) {
    return this.policy.getPolicy(tenantId, actorUserId)
  }

  async updatePolicy(tenantId: string, actorUserId: string, fields: Parameters<ModelPolicyEngine['updatePolicy']>[2]) {
    return this.policy.updatePolicy(tenantId, actorUserId, fields)
  }

  async listFallbackEvents(tenantId: string, actorUserId: string, limit?: number) {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    return this.fallback.listFallbackEvents(tenantId, limit)
  }

  // ── Completion (routing + fallback + tracking, all in one call) ────────

  /**
   * Routes, executes, tracks usage, and falls back on failure — all in one
   * call. Never throws a raw provider error: on total failure across the
   * fallback chain it throws GatewayUserFacingError.
   */
  async complete(input: GatewayCompleteInput): Promise<NormalizedResponse> {
    await this.tenants.requireIdentity(input.tenantId, input.userId)

    const requestId = uuidv4()
    const prompt = this.promptNormalizer.build(input)

    const routingRequest: RoutingRequest = {
      taskType: input.taskType,
      tenantId: input.tenantId,
      userId: input.userId,
      requiredCapabilities: input.requiredCapabilities,
      maxCostUsd: input.maxCostUsd,
      maxLatencyMs: input.maxLatencyMs,
      privacyLevel: input.privacyLevel,
      preferredProvider: input.preferredProvider,
      preferredModel: input.preferredModel,
    }

    const promptTextForEstimate = [input.systemPrompt, input.userMessage].join('\n')
    const decision = await this.router.route(routingRequest, promptTextForEstimate)

    const attemptedModelIds: string[] = []
    let candidate: ModelDescriptor | null = decision.model
    let fallbackUsed = false
    let lastError: unknown = null

    let attempts = 0
    const maxAttempts = Math.max(1, this.config.fallbackMaxAttempts)

    while (candidate && attempts < maxAttempts) {
      attempts += 1
      attemptedModelIds.push(candidate.modelId)
      const provider = this.registry.get(candidate.provider)
      const start = Date.now()
      try {
        const result = await provider.complete(prompt, { model: candidate.modelId, debugMode: this.config.debugMode })
        const latencyMs = Date.now() - start

        await this.health.recordOutcome(input.tenantId, candidate.provider, true, latencyMs)
        this.benchmark.record({ provider: candidate.provider, model: candidate.modelId, latencyMs, success: true })

        await this.usage.record({
          tenantId: input.tenantId,
          userId: input.userId,
          requestId,
          provider: candidate.provider,
          model: candidate.modelId,
          taskType: input.taskType,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          estimatedCostUsd: result.usage.estimatedCostUsd,
          latencyMs,
          success: true,
          fallbackUsed,
        })

        this.telemetry.requestCompleted({
          tenantId: input.tenantId, userId: input.userId, requestId,
          provider: candidate.provider, model: candidate.modelId, taskType: input.taskType,
          latencyMs, inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens,
          estimatedCostUsd: result.usage.estimatedCostUsd,
        })

        if (fallbackUsed) {
          await this.fallback.logFallbackEvent({
            tenantId: input.tenantId, userId: input.userId, requestId,
            originalProvider: decision.model.provider, originalModel: decision.model.modelId,
            failureClass: 'unknown', fallbackProvider: candidate.provider, fallbackModel: candidate.modelId,
            succeeded: true,
          })
        }

        return this.responseNormalizer.finalize(result, this.config.debugMode)
      } catch (err) {
        lastError = err
        const latencyMs = Date.now() - start
        const failureClass = this.fallback.classifyFailure(err)

        await this.health.recordOutcome(input.tenantId, candidate.provider, false, latencyMs, failureClass)
        this.benchmark.record({ provider: candidate.provider, model: candidate.modelId, latencyMs, success: false })

        await this.usage.record({
          tenantId: input.tenantId,
          userId: input.userId,
          requestId,
          provider: candidate.provider,
          model: candidate.modelId,
          taskType: input.taskType,
          inputTokens: 0,
          outputTokens: 0,
          estimatedCostUsd: 0,
          latencyMs,
          success: false,
          fallbackUsed,
        })

        this.telemetry.requestFailed({
          tenantId: input.tenantId, userId: input.userId, requestId,
          provider: candidate.provider, model: candidate.modelId, errorClass: failureClass,
        })

        if (!this.fallback.isRetryable(failureClass)) break

        const next = this.fallback.nextCandidate(decision.fallbackChain, attemptedModelIds)
        if (next) {
          await this.fallback.logFallbackEvent({
            tenantId: input.tenantId, userId: input.userId, requestId,
            originalProvider: decision.model.provider, originalModel: decision.model.modelId,
            failureClass, fallbackProvider: next.provider, fallbackModel: next.modelId,
            succeeded: false, // flips to true above if the retry then succeeds
          })
        }
        fallbackUsed = true
        candidate = next
      }
    }

    void lastError // never surfaced — classified + logged above only
    throw this.fallback.toUserFacingError()
  }

  estimateCost(model: ModelDescriptor, inputTokens: number, outputTokens: number): number {
    return this.costEstimator.estimate(model, inputTokens, outputTokens)
  }
}
