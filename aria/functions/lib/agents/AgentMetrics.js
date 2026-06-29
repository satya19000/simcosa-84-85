"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentMetrics = void 0;
class AgentMetrics {
    constructor(agentId) {
        this.agentId = agentId;
        this.totalTasks = 0;
        this.successfulTasks = 0;
        this.failedTasks = 0;
        this.retryCount = 0;
        this.durations = [];
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.tokenInput = 0;
        this.tokenOutput = 0;
        this.peakConcurrency = 0;
        this.currentConcurrency = 0;
        this.lastTaskAt = null;
        this.lastErrorAt = null;
        this.lastErrorMessage = null;
    }
    recordTaskStart() {
        this.totalTasks++;
        this.currentConcurrency++;
        if (this.currentConcurrency > this.peakConcurrency) {
            this.peakConcurrency = this.currentConcurrency;
        }
        this.lastTaskAt = new Date().toISOString();
    }
    recordTaskEnd(durationMs, success) {
        this.currentConcurrency = Math.max(0, this.currentConcurrency - 1);
        this.durations.push(durationMs);
        if (this.durations.length > 500)
            this.durations.shift();
        if (success)
            this.successfulTasks++;
        else
            this.failedTasks++;
    }
    recordRetry() { this.retryCount++; }
    recordCacheHit() { this.cacheHits++; }
    recordCacheMiss() { this.cacheMisses++; }
    recordTokens(input, output) {
        this.tokenInput += input;
        this.tokenOutput += output;
    }
    recordError(message) {
        this.lastErrorAt = new Date().toISOString();
        this.lastErrorMessage = message;
    }
    snapshot() {
        const totalDuration = this.durations.reduce((a, b) => a + b, 0);
        const avg = this.durations.length > 0 ? Math.round(totalDuration / this.durations.length) : 0;
        const successRate = this.totalTasks > 0 ? this.successfulTasks / this.totalTasks : 1;
        return {
            agentId: this.agentId,
            totalTasks: this.totalTasks,
            successfulTasks: this.successfulTasks,
            failedTasks: this.failedTasks,
            retryCount: this.retryCount,
            totalDurationMs: totalDuration,
            avgLatencyMs: avg,
            cacheHits: this.cacheHits,
            cacheMisses: this.cacheMisses,
            tokenUsageInput: this.tokenInput,
            tokenUsageOutput: this.tokenOutput,
            peakConcurrency: this.peakConcurrency,
            lastTaskAt: this.lastTaskAt,
            lastErrorAt: this.lastErrorAt,
            lastErrorMessage: this.lastErrorMessage,
            successRate,
        };
    }
}
exports.AgentMetrics = AgentMetrics;
//# sourceMappingURL=AgentMetrics.js.map