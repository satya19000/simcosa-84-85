import type { ModelDescriptor, RoutingDecision, RoutingRequest, ModelCapability } from './ModelTypes'
import { ModelCatalogStore } from './ModelCatalog'
import { ModelCostEstimator } from './ModelCostEstimator'
import type { ProviderHealthTracker } from './ProviderHealth'
import type { ModelPolicyEngine } from './ModelPolicyEngine'

/**
 * Selects the best model for a RoutingRequest by scoring every catalog
 * candidate against: task-type match, required capabilities, cost ceiling,
 * latency ceiling, privacy level, provider health/circuit-breaker state,
 * tenant policy, and a user/provider preference bonus. Never talks to a
 * provider directly — only ProviderHealthTracker (read) and
 * ModelPolicyEngine (read) for routing inputs.
 */
export class ModelRouter {
  private readonly catalog = new ModelCatalogStore()
  private readonly costEstimator = new ModelCostEstimator()

  constructor(
    private readonly healthTracker: ProviderHealthTracker,
    private readonly policyEngine: ModelPolicyEngine
  ) {}

  async route(request: RoutingRequest, promptTextForCostEstimate = ''): Promise<RoutingDecision> {
    const candidates = this.catalog
      .byTaskType(request.taskType)
      .filter((m) => !m.isPlaceholder) // never auto-route to LocalLLMProvider — it's not functional
      .filter((m) => this.hasRequiredCapabilities(m, request.requiredCapabilities))
      .filter((m) => this.withinLatencyCeiling(m, request.maxLatencyMs))
      .filter((m) => this.matchesPrivacy(m, request.privacyLevel))

    const scored: { model: ModelDescriptor; score: number }[] = []

    for (const model of candidates) {
      const estimatedCost = this.costEstimator.estimateForPrompt(model, promptTextForCostEstimate)
      if (this.costEstimator.exceedsCeiling(estimatedCost, request.maxCostUsd)) continue

      const routable = request.tenantId
        ? await this.healthTracker.isRoutable(request.tenantId, model.provider)
        : true
      if (!routable) continue

      if (request.tenantId) {
        const policyCheck = await this.policyEngine.evaluate(request.tenantId, request.userId, {
          provider: model.provider,
          taskType: request.taskType,
          privacyLevel: model.privacyLevel,
          estimatedCostUsd: estimatedCost,
        })
        if (!policyCheck.allowed) continue
      }

      scored.push({ model, score: this.scoreModel(model, request) })
    }

    scored.sort((a, b) => b.score - a.score)

    if (scored.length === 0) {
      throw new Error(`No eligible model found for task type "${request.taskType}" under the given constraints`)
    }

    const [best, ...rest] = scored
    return {
      model: best.model,
      reason: this.explain(best.model, request),
      fallbackChain: rest.map((s) => s.model),
    }
  }

  private hasRequiredCapabilities(model: ModelDescriptor, required?: ModelCapability[]): boolean {
    if (!required || required.length === 0) return true
    return required.every((cap) => model.capabilities.includes(cap))
  }

  private withinLatencyCeiling(model: ModelDescriptor, maxLatencyMs?: number): boolean {
    if (!maxLatencyMs) return true
    return model.typicalLatencyMs <= maxLatencyMs
  }

  private matchesPrivacy(model: ModelDescriptor, privacyLevel?: string): boolean {
    if (!privacyLevel) return true
    if (privacyLevel === 'standard') return true
    // sensitive/restricted privacy requests can only be served by a
    // non-placeholder local model — none exists yet, so this correctly
    // excludes all current cloud candidates rather than silently relaxing.
    return model.provider === 'local' && !model.isPlaceholder
  }

  private scoreModel(model: ModelDescriptor, request: RoutingRequest): number {
    let score = model.qualityScore

    if (request.preferredProvider && model.provider === request.preferredProvider) score += 15
    if (request.preferredModel && model.modelId === request.preferredModel) score += 25

    // Lightweight/classification tasks should favor cheap+fast models even
    // if a higher-quality model is technically eligible.
    if (request.taskType === 'lightweight' || request.taskType === 'classification') {
      score -= model.costPerKInputTokens * 1000
      score -= model.typicalLatencyMs / 200
    }

    // Reasoning/code tasks favor quality over cost.
    if (request.taskType === 'reasoning' || request.taskType === 'code_generation') {
      score += model.contextWindow > 100_000 ? 5 : 0
    }

    return score
  }

  private explain(model: ModelDescriptor, request: RoutingRequest): string {
    return `Selected ${model.displayName} (${model.provider}) for task type "${request.taskType}" — quality score ${model.qualityScore}, ~$${model.costPerKInputTokens}/K in tokens`
  }
}
