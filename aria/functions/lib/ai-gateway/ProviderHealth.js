"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderHealthTracker = void 0;
const HEALTH_COL = (tenantId) => `tenants/${tenantId}/aiProviderHealth`;
const FAILURE_THRESHOLD_TO_OPEN = 3;
const HALF_OPEN_AFTER_MS = 60000;
/**
 * Tracks per-provider health (latency, failure rate, circuit breaker state)
 * persisted at tenants/{tenantId}/aiProviderHealth/{providerId}. Read by
 * ModelRouter before routing and by ModelFallbackManager after a failure.
 */
class ProviderHealthTracker {
    constructor(db, registry) {
        this.db = db;
        this.registry = registry;
    }
    docRef(tenantId, providerId) {
        return this.db.collection(HEALTH_COL(tenantId)).doc(providerId);
    }
    async getRecord(tenantId, providerId) {
        const snap = await this.docRef(tenantId, providerId).get();
        if (snap.exists)
            return snap.data();
        return this.defaultRecord(tenantId, providerId);
    }
    async listRecords(tenantId) {
        const snap = await this.db.collection(HEALTH_COL(tenantId)).get();
        const existing = new Map(snap.docs.map((d) => [d.id, d.data()]));
        return this.registry.ids().map((id) => existing.get(id) ?? this.defaultRecord(tenantId, id));
    }
    /** Runs each provider's healthCheck() and records the result for the tenant. */
    async runHealthCheck(tenantId, providerId) {
        const provider = this.registry.get(providerId);
        const result = await provider.healthCheck();
        const now = new Date().toISOString();
        const prior = await this.getRecord(tenantId, providerId);
        const consecutiveFailures = result.available ? 0 : prior.consecutiveFailures + 1;
        const circuitBreakerStatus = this.computeCircuitState(prior, result.available, consecutiveFailures);
        const updated = {
            ...prior,
            avgLatencyMs: result.available ? Math.round((prior.avgLatencyMs + result.latencyMs) / 2) : prior.avgLatencyMs,
            failureRate: this.recomputeFailureRate(prior.failureRate, result.available),
            lastErrorType: result.available ? prior.lastErrorType : (result.error ?? 'unknown'),
            lastSuccessAt: result.available ? now : prior.lastSuccessAt,
            lastFailureAt: result.available ? prior.lastFailureAt : now,
            available: result.available,
            circuitBreakerStatus,
            consecutiveFailures,
            updatedAt: now,
        };
        await this.docRef(tenantId, providerId).set(updated, { merge: true });
        return updated;
    }
    async recordOutcome(tenantId, providerId, success, latencyMs, errorType) {
        const now = new Date().toISOString();
        const prior = await this.getRecord(tenantId, providerId);
        const consecutiveFailures = success ? 0 : prior.consecutiveFailures + 1;
        const circuitBreakerStatus = this.computeCircuitState(prior, success, consecutiveFailures);
        const updated = {
            ...prior,
            avgLatencyMs: Math.round((prior.avgLatencyMs + latencyMs) / 2),
            failureRate: this.recomputeFailureRate(prior.failureRate, success),
            lastErrorType: success ? prior.lastErrorType : (errorType ?? 'unknown'),
            lastSuccessAt: success ? now : prior.lastSuccessAt,
            lastFailureAt: success ? prior.lastFailureAt : now,
            available: circuitBreakerStatus !== 'open',
            circuitBreakerStatus,
            consecutiveFailures,
            updatedAt: now,
        };
        await this.docRef(tenantId, providerId).set(updated, { merge: true });
    }
    /** True when the circuit breaker permits routing to this provider right now. */
    async isRoutable(tenantId, providerId) {
        const record = await this.getRecord(tenantId, providerId);
        if (record.circuitBreakerStatus === 'open') {
            const openedAt = record.lastFailureAt ? new Date(record.lastFailureAt).getTime() : 0;
            return Date.now() - openedAt > HALF_OPEN_AFTER_MS; // allow a half-open probe attempt
        }
        return true;
    }
    computeCircuitState(prior, success, consecutiveFailures) {
        if (success)
            return 'closed';
        if (prior.circuitBreakerStatus === 'half_open')
            return 'open'; // failed probe re-opens
        if (consecutiveFailures >= FAILURE_THRESHOLD_TO_OPEN)
            return 'open';
        return prior.circuitBreakerStatus;
    }
    recomputeFailureRate(priorRate, success) {
        // Simple exponential moving average — good enough for routing heuristics,
        // not a precision SLO metric.
        const alpha = 0.2;
        const sample = success ? 0 : 1;
        return Math.round((priorRate * (1 - alpha) + sample * alpha) * 1000) / 1000;
    }
    defaultRecord(tenantId, providerId) {
        return {
            id: providerId,
            providerId,
            tenantId,
            avgLatencyMs: 0,
            failureRate: 0,
            lastErrorType: null,
            lastSuccessAt: null,
            lastFailureAt: null,
            available: true,
            circuitBreakerStatus: 'closed',
            consecutiveFailures: 0,
            updatedAt: new Date().toISOString(),
        };
    }
}
exports.ProviderHealthTracker = ProviderHealthTracker;
//# sourceMappingURL=ProviderHealth.js.map