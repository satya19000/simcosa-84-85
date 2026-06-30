"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelRouter = void 0;
const ModelCatalog_1 = require("./ModelCatalog");
const ModelCostEstimator_1 = require("./ModelCostEstimator");
/**
 * Selects the best model for a RoutingRequest by scoring every catalog
 * candidate against: task-type match, required capabilities, cost ceiling,
 * latency ceiling, privacy level, provider health/circuit-breaker state,
 * tenant policy, and a user/provider preference bonus. Never talks to a
 * provider directly — only ProviderHealthTracker (read) and
 * ModelPolicyEngine (read) for routing inputs.
 */
class ModelRouter {
    constructor(healthTracker, policyEngine) {
        this.healthTracker = healthTracker;
        this.policyEngine = policyEngine;
        this.catalog = new ModelCatalog_1.ModelCatalogStore();
        this.costEstimator = new ModelCostEstimator_1.ModelCostEstimator();
    }
    async route(request, promptTextForCostEstimate = '') {
        const candidates = this.catalog
            .byTaskType(request.taskType)
            .filter((m) => !m.isPlaceholder) // never auto-route to LocalLLMProvider — it's not functional
            .filter((m) => this.hasRequiredCapabilities(m, request.requiredCapabilities))
            .filter((m) => this.withinLatencyCeiling(m, request.maxLatencyMs))
            .filter((m) => this.matchesPrivacy(m, request.privacyLevel));
        const scored = [];
        for (const model of candidates) {
            const estimatedCost = this.costEstimator.estimateForPrompt(model, promptTextForCostEstimate);
            if (this.costEstimator.exceedsCeiling(estimatedCost, request.maxCostUsd))
                continue;
            const routable = request.tenantId
                ? await this.healthTracker.isRoutable(request.tenantId, model.provider)
                : true;
            if (!routable)
                continue;
            if (request.tenantId) {
                const policyCheck = await this.policyEngine.evaluate(request.tenantId, request.userId, {
                    provider: model.provider,
                    taskType: request.taskType,
                    privacyLevel: model.privacyLevel,
                    estimatedCostUsd: estimatedCost,
                });
                if (!policyCheck.allowed)
                    continue;
            }
            scored.push({ model, score: this.scoreModel(model, request) });
        }
        scored.sort((a, b) => b.score - a.score);
        if (scored.length === 0) {
            throw new Error(`No eligible model found for task type "${request.taskType}" under the given constraints`);
        }
        const [best, ...rest] = scored;
        return {
            model: best.model,
            reason: this.explain(best.model, request),
            fallbackChain: rest.map((s) => s.model),
        };
    }
    hasRequiredCapabilities(model, required) {
        if (!required || required.length === 0)
            return true;
        return required.every((cap) => model.capabilities.includes(cap));
    }
    withinLatencyCeiling(model, maxLatencyMs) {
        if (!maxLatencyMs)
            return true;
        return model.typicalLatencyMs <= maxLatencyMs;
    }
    matchesPrivacy(model, privacyLevel) {
        if (!privacyLevel)
            return true;
        if (privacyLevel === 'standard')
            return true;
        // sensitive/restricted privacy requests can only be served by a
        // non-placeholder local model — none exists yet, so this correctly
        // excludes all current cloud candidates rather than silently relaxing.
        return model.provider === 'local' && !model.isPlaceholder;
    }
    scoreModel(model, request) {
        let score = model.qualityScore;
        if (request.preferredProvider && model.provider === request.preferredProvider)
            score += 15;
        if (request.preferredModel && model.modelId === request.preferredModel)
            score += 25;
        // Lightweight/classification tasks should favor cheap+fast models even
        // if a higher-quality model is technically eligible.
        if (request.taskType === 'lightweight' || request.taskType === 'classification') {
            score -= model.costPerKInputTokens * 1000;
            score -= model.typicalLatencyMs / 200;
        }
        // Reasoning/code tasks favor quality over cost.
        if (request.taskType === 'reasoning' || request.taskType === 'code_generation') {
            score += model.contextWindow > 100000 ? 5 : 0;
        }
        return score;
    }
    explain(model, request) {
        return `Selected ${model.displayName} (${model.provider}) for task type "${request.taskType}" — quality score ${model.qualityScore}, ~$${model.costPerKInputTokens}/K in tokens`;
    }
}
exports.ModelRouter = ModelRouter;
//# sourceMappingURL=ModelRouter.js.map