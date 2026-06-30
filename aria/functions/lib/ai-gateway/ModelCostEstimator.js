"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelCostEstimator = void 0;
const TokenEstimator_1 = require("./TokenEstimator");
/**
 * Pure cost-estimation helpers. Never performs I/O — used by ModelRouter
 * (pre-flight cost ceiling checks) and ModelUsageTracker (post-flight
 * recorded cost) alike. Estimates are approximate (see ModelCatalog's
 * header comment); this is explicitly a simplistic guard, not metered
 * billing-grade accounting.
 */
class ModelCostEstimator {
    constructor() {
        this.tokenEstimator = new TokenEstimator_1.TokenEstimator();
    }
    estimateForPrompt(model, promptText, expectedOutputTokens = 512) {
        const inputTokens = this.tokenEstimator.estimate(promptText);
        return this.estimate(model, inputTokens, expectedOutputTokens);
    }
    estimate(model, inputTokens, outputTokens) {
        return (inputTokens / 1000) * model.costPerKInputTokens + (outputTokens / 1000) * model.costPerKOutputTokens;
    }
    exceedsCeiling(estimatedCostUsd, maxCostUsd) {
        if (maxCostUsd == null)
            return false;
        return estimatedCostUsd > maxCostUsd;
    }
}
exports.ModelCostEstimator = ModelCostEstimator;
//# sourceMappingURL=ModelCostEstimator.js.map