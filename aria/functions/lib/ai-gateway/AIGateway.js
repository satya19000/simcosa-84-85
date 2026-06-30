"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIGateway = void 0;
const uuid_1 = require("uuid");
const ProviderRegistry_1 = require("./ProviderRegistry");
const ProviderHealth_1 = require("./ProviderHealth");
const ModelPolicyEngine_1 = require("./ModelPolicyEngine");
const ModelPermissions_1 = require("./ModelPermissions");
const ModelUsageTracker_1 = require("./ModelUsageTracker");
const ModelRouter_1 = require("./ModelRouter");
const ModelFallbackManager_1 = require("./ModelFallbackManager");
const ModelBenchmark_1 = require("./ModelBenchmark");
const ModelCostEstimator_1 = require("./ModelCostEstimator");
const ModelCatalog_1 = require("./ModelCatalog");
const PromptNormalizer_1 = require("./PromptNormalizer");
const ResponseNormalizer_1 = require("./ResponseNormalizer");
const ModelTelemetry_1 = require("./ModelTelemetry");
/**
 * Top-level facade for the Multi-LLM Gateway — the ai-gateway-module
 * equivalent of MarketplaceEngine/SecurityEngine. Composes ProviderRegistry,
 * ModelRouter, ModelPolicyEngine, ModelFallbackManager, ModelUsageTracker,
 * and the normalizers. This is the ONLY class aiGatewayApi.ts and any
 * forward-compatible agent adapter should talk to.
 */
class AIGateway {
    constructor(db, config, apiKeys, tenants, rbac) {
        this.config = config;
        this.tenants = tenants;
        this.benchmark = new ModelBenchmark_1.ModelBenchmark();
        this.catalog = new ModelCatalog_1.ModelCatalogStore();
        this.costEstimator = new ModelCostEstimator_1.ModelCostEstimator();
        this.promptNormalizer = new PromptNormalizer_1.PromptNormalizer();
        this.responseNormalizer = new ResponseNormalizer_1.ResponseNormalizer();
        this.telemetry = new ModelTelemetry_1.ModelTelemetry();
        this.registry = new ProviderRegistry_1.ProviderRegistry(apiKeys);
        this.health = new ProviderHealth_1.ProviderHealthTracker(db, this.registry);
        this.permissions = new ModelPermissions_1.ModelPermissions(rbac);
        this.usage = new ModelUsageTracker_1.ModelUsageTracker(db);
        this.policy = new ModelPolicyEngine_1.ModelPolicyEngine(db, tenants, this.permissions, this.usage);
        this.router = new ModelRouter_1.ModelRouter(this.health, this.policy);
        this.fallback = new ModelFallbackManager_1.ModelFallbackManager(db);
    }
    get effectiveConfig() {
        return this.config;
    }
    // ── Discovery ─────────────────────────────────────────────────────────
    listProviders() {
        return this.registry.ids();
    }
    listModels() {
        return this.catalog.list();
    }
    async testProvider(tenantId, actorUserId, providerId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const result = await this.health.runHealthCheck(tenantId, providerId);
        this.telemetry.healthCheckRun({ tenantId, provider: providerId, available: result.available, latencyMs: result.avgLatencyMs });
        return result;
    }
    async listProviderHealth(tenantId, actorUserId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        return this.health.listRecords(tenantId);
    }
    async getUsage(tenantId, actorUserId, limit) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        return this.usage.listRecent(tenantId, limit);
    }
    async getPolicy(tenantId, actorUserId) {
        return this.policy.getPolicy(tenantId, actorUserId);
    }
    async updatePolicy(tenantId, actorUserId, fields) {
        return this.policy.updatePolicy(tenantId, actorUserId, fields);
    }
    async listFallbackEvents(tenantId, actorUserId, limit) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        return this.fallback.listFallbackEvents(tenantId, limit);
    }
    // ── Completion (routing + fallback + tracking, all in one call) ────────
    /**
     * Routes, executes, tracks usage, and falls back on failure — all in one
     * call. Never throws a raw provider error: on total failure across the
     * fallback chain it throws GatewayUserFacingError.
     */
    async complete(input) {
        await this.tenants.requireIdentity(input.tenantId, input.userId);
        const requestId = (0, uuid_1.v4)();
        const prompt = this.promptNormalizer.build(input);
        const routingRequest = {
            taskType: input.taskType,
            tenantId: input.tenantId,
            userId: input.userId,
            requiredCapabilities: input.requiredCapabilities,
            maxCostUsd: input.maxCostUsd,
            maxLatencyMs: input.maxLatencyMs,
            privacyLevel: input.privacyLevel,
            preferredProvider: input.preferredProvider,
            preferredModel: input.preferredModel,
        };
        const promptTextForEstimate = [input.systemPrompt, input.userMessage].join('\n');
        const decision = await this.router.route(routingRequest, promptTextForEstimate);
        const attemptedModelIds = [];
        let candidate = decision.model;
        let fallbackUsed = false;
        let lastError = null;
        let attempts = 0;
        const maxAttempts = Math.max(1, this.config.fallbackMaxAttempts);
        while (candidate && attempts < maxAttempts) {
            attempts += 1;
            attemptedModelIds.push(candidate.modelId);
            const provider = this.registry.get(candidate.provider);
            const start = Date.now();
            try {
                const result = await provider.complete(prompt, { model: candidate.modelId, debugMode: this.config.debugMode });
                const latencyMs = Date.now() - start;
                await this.health.recordOutcome(input.tenantId, candidate.provider, true, latencyMs);
                this.benchmark.record({ provider: candidate.provider, model: candidate.modelId, latencyMs, success: true });
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
                });
                this.telemetry.requestCompleted({
                    tenantId: input.tenantId, userId: input.userId, requestId,
                    provider: candidate.provider, model: candidate.modelId, taskType: input.taskType,
                    latencyMs, inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens,
                    estimatedCostUsd: result.usage.estimatedCostUsd,
                });
                if (fallbackUsed) {
                    await this.fallback.logFallbackEvent({
                        tenantId: input.tenantId, userId: input.userId, requestId,
                        originalProvider: decision.model.provider, originalModel: decision.model.modelId,
                        failureClass: 'unknown', fallbackProvider: candidate.provider, fallbackModel: candidate.modelId,
                        succeeded: true,
                    });
                }
                return this.responseNormalizer.finalize(result, this.config.debugMode);
            }
            catch (err) {
                lastError = err;
                const latencyMs = Date.now() - start;
                const failureClass = this.fallback.classifyFailure(err);
                await this.health.recordOutcome(input.tenantId, candidate.provider, false, latencyMs, failureClass);
                this.benchmark.record({ provider: candidate.provider, model: candidate.modelId, latencyMs, success: false });
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
                });
                this.telemetry.requestFailed({
                    tenantId: input.tenantId, userId: input.userId, requestId,
                    provider: candidate.provider, model: candidate.modelId, errorClass: failureClass,
                });
                if (!this.fallback.isRetryable(failureClass))
                    break;
                const next = this.fallback.nextCandidate(decision.fallbackChain, attemptedModelIds);
                if (next) {
                    await this.fallback.logFallbackEvent({
                        tenantId: input.tenantId, userId: input.userId, requestId,
                        originalProvider: decision.model.provider, originalModel: decision.model.modelId,
                        failureClass, fallbackProvider: next.provider, fallbackModel: next.modelId,
                        succeeded: false, // flips to true above if the retry then succeeds
                    });
                }
                fallbackUsed = true;
                candidate = next;
            }
        }
        void lastError; // never surfaced — classified + logged above only
        throw this.fallback.toUserFacingError();
    }
    estimateCost(model, inputTokens, outputTokens) {
        return this.costEstimator.estimate(model, inputTokens, outputTokens);
    }
}
exports.AIGateway = AIGateway;
//# sourceMappingURL=AIGateway.js.map