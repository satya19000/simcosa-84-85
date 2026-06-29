"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginMetrics = void 0;
class PluginMetrics {
    constructor(pluginId) {
        this.pluginId = pluginId;
        this.startupTimeMs = 0;
        this.executions = [];
        this.errors = 0;
        this.warnings = 0;
        this.apiCalls = 0;
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.lastExecutionAt = null;
        this.lastErrorAt = null;
        this.lastErrorMessage = null;
    }
    recordStartup(ms) {
        this.startupTimeMs = ms;
    }
    recordExecution(ms) {
        this.executions.push(ms);
        if (this.executions.length > 1000)
            this.executions.shift();
        this.lastExecutionAt = new Date().toISOString();
    }
    recordError(message) {
        this.errors++;
        this.lastErrorAt = new Date().toISOString();
        this.lastErrorMessage = message;
    }
    recordWarning() {
        this.warnings++;
    }
    recordApiCall() {
        this.apiCalls++;
    }
    recordCacheHit() {
        this.cacheHits++;
    }
    recordCacheMiss() {
        this.cacheMisses++;
    }
    snapshot() {
        const avg = this.executions.length > 0
            ? Math.round(this.executions.reduce((a, b) => a + b, 0) / this.executions.length)
            : 0;
        const errorRate = this.executions.length > 0 ? this.errors / this.executions.length : 0;
        const health = errorRate > 0.5 ? 'unhealthy' : errorRate > 0.1 ? 'degraded' : 'healthy';
        return {
            pluginId: this.pluginId,
            startupTimeMs: this.startupTimeMs,
            totalExecutions: this.executions.length,
            totalErrors: this.errors,
            totalWarnings: this.warnings,
            totalApiCalls: this.apiCalls,
            avgExecutionTimeMs: avg,
            cacheHits: this.cacheHits,
            cacheMisses: this.cacheMisses,
            lastExecutionAt: this.lastExecutionAt,
            lastErrorAt: this.lastErrorAt,
            lastErrorMessage: this.lastErrorMessage,
            health,
        };
    }
    reset() {
        this.executions = [];
        this.errors = 0;
        this.warnings = 0;
        this.apiCalls = 0;
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.lastExecutionAt = null;
        this.lastErrorAt = null;
        this.lastErrorMessage = null;
    }
}
exports.PluginMetrics = PluginMetrics;
//# sourceMappingURL=PluginMetrics.js.map