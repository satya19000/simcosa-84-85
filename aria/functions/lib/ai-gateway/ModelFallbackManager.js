"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelFallbackManager = exports.GatewayUserFacingError = void 0;
const uuid_1 = require("uuid");
const ModelTelemetry_1 = require("./ModelTelemetry");
const FALLBACK_EVENTS_COL = (tenantId) => `tenants/${tenantId}/aiFallbackEvents`;
/** A clean, user-safe error — never includes the raw provider error message. */
class GatewayUserFacingError extends Error {
    constructor(message = 'The AI service is temporarily unavailable. Please try again shortly.') {
        super(message);
        this.name = 'GatewayUserFacingError';
    }
}
exports.GatewayUserFacingError = GatewayUserFacingError;
/**
 * Classifies provider failures and decides whether/how to fall back to the
 * next model in a RoutingDecision's fallbackChain. Never exposes a raw
 * provider error to the caller — complete()'s catch path always rethrows
 * GatewayUserFacingError (or returns a successful fallback result).
 */
class ModelFallbackManager {
    constructor(db) {
        this.db = db;
        this.telemetry = new ModelTelemetry_1.ModelTelemetry();
    }
    classifyFailure(error) {
        const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        if (message.includes('429') || message.includes('rate limit'))
            return 'rate_limit';
        if (message.includes('401') || message.includes('403') || message.includes('auth') || message.includes('api key'))
            return 'auth';
        if (message.includes('timeout') || message.includes('etimedout') || message.includes('econnreset'))
            return 'timeout';
        if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('server error'))
            return 'server_error';
        if (message.includes('400') || message.includes('invalid'))
            return 'invalid_request';
        return 'unknown';
    }
    /** Whether this failure class is worth retrying against a fallback model at all. */
    isRetryable(failureClass) {
        return failureClass !== 'invalid_request';
    }
    async logFallbackEvent(input) {
        const eventId = (0, uuid_1.v4)();
        const record = {
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
        };
        await this.db.collection(FALLBACK_EVENTS_COL(input.tenantId)).doc(eventId).set(record);
        this.telemetry.fallbackTriggered({
            tenantId: input.tenantId,
            requestId: input.requestId,
            originalProvider: input.originalProvider,
            fallbackProvider: input.fallbackProvider,
            failureClass: input.failureClass,
        });
        return record;
    }
    async listFallbackEvents(tenantId, limit = 50) {
        const snap = await this.db
            .collection(FALLBACK_EVENTS_COL(tenantId))
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map((d) => d.data());
    }
    /** Picks the next usable model from a fallback chain, excluding placeholders. */
    nextCandidate(fallbackChain, excludeModelIds) {
        return fallbackChain.find((m) => !m.isPlaceholder && !excludeModelIds.includes(m.modelId)) ?? null;
    }
    toUserFacingError() {
        return new GatewayUserFacingError();
    }
}
exports.ModelFallbackManager = ModelFallbackManager;
//# sourceMappingURL=ModelFallbackManager.js.map