"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const AgentLogger_1 = require("../AgentLogger");
const AgentMetrics_1 = require("../AgentMetrics");
const AgentMemory_1 = require("../AgentMemory");
/**
 * Shared base for all built-in agents.
 * Provides default implementations of plan, validate, rollback, shutdown, healthCheck.
 * Subclasses must implement: manifest (readonly), canHandle(), execute().
 */
class BaseAgent {
    constructor() {
        this.config = {};
        this.status = 'unregistered';
        // Delay logger/metrics construction until manifest is available (set by subclass)
        // Using a late-init trick via getter-like approach via Proxy would be over-engineering;
        // instead we pass 'base' and subclass overrides with its own id after super().
        this.logger = new AgentLogger_1.AgentLogger('base-agent');
        this.metrics = new AgentMetrics_1.AgentMetrics('base-agent');
        this.memory = new AgentMemory_1.AgentMemory('base-agent');
    }
    async initialize(config) {
        Object.assign(this.config, config);
        this.status = 'idle';
    }
    /** Default: pass-through. Subclasses can override to add planning logic. */
    async plan(_task, _ctx) {
        return {};
    }
    /** Default: pass if status is completed and output is not null. */
    async validate(result, _ctx) {
        if (result.status === 'completed' && result.output !== null) {
            return { outcome: 'pass', issues: [], confidence: 1 };
        }
        return { outcome: 'fail', issues: [result.error ?? 'No output produced'], confidence: 0.9 };
    }
    /** Default: no-op rollback. */
    async rollback(_task, _ctx) { }
    async shutdown() {
        this.status = 'shutdown';
    }
    async healthCheck() {
        const start = Date.now();
        return {
            agentId: this.manifest.id,
            status: this.status,
            healthy: this.status !== 'error' && this.status !== 'shutdown' && this.status !== 'disabled',
            lastCheckedAt: new Date().toISOString(),
            responseTimeMs: Date.now() - start,
        };
    }
    makeResult(task, ctx, output, summary, startMs, tokenUsage) {
        return {
            taskId: task.taskId,
            graphRunId: ctx.graphRunId,
            agentId: ctx.agentId,
            status: 'completed',
            output,
            summary,
            tokenUsage,
            durationMs: Date.now() - startMs,
            attempts: task.attempts + 1,
            completedAt: new Date().toISOString(),
        };
    }
    makeErrorResult(task, ctx, error, startMs) {
        return {
            taskId: task.taskId,
            graphRunId: ctx.graphRunId,
            agentId: ctx.agentId,
            status: 'failed',
            output: null,
            summary: `Failed: ${String(error)}`,
            durationMs: Date.now() - startMs,
            attempts: task.attempts + 1,
            error: String(error),
            completedAt: new Date().toISOString(),
        };
    }
}
exports.BaseAgent = BaseAgent;
//# sourceMappingURL=BaseAgent.js.map