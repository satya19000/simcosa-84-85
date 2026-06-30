"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelTelemetry = void 0;
const ModelLogger_1 = require("./ModelLogger");
/**
 * Thin telemetry facade over ModelLogger for the specific event shapes the
 * spec calls out (provider, model, latency, tokens, cost, fallback events,
 * errors, policy denials). Keeps call sites in AIGateway/ModelRouter/
 * ModelFallbackManager declarative instead of hand-rolling log lines.
 */
class ModelTelemetry {
    constructor() {
        this.logger = new ModelLogger_1.ModelLogger();
    }
    requestCompleted(fields) {
        this.logger.info('ai_gateway.request_completed', fields);
    }
    requestFailed(fields) {
        this.logger.warn('ai_gateway.request_failed', fields);
    }
    fallbackTriggered(fields) {
        this.logger.warn('ai_gateway.fallback_triggered', fields);
    }
    policyDenied(fields) {
        this.logger.warn('ai_gateway.policy_denied', fields);
    }
    healthCheckRun(fields) {
        this.logger.info('ai_gateway.health_check', fields);
    }
}
exports.ModelTelemetry = ModelTelemetry;
//# sourceMappingURL=ModelTelemetry.js.map