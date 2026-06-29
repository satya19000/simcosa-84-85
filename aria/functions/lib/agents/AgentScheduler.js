"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentScheduler = void 0;
const AgentLogger_1 = require("./AgentLogger");
/**
 * Background job runner for periodic agent tasks.
 * Runs in Cloud Function warm instances — no real setInterval needed;
 * tick() is called explicitly (e.g., on each incoming request) to fire due jobs.
 */
class AgentScheduler {
    constructor(manager) {
        this.manager = manager;
        this.logger = new AgentLogger_1.AgentLogger('agent-scheduler');
        this.jobs = new Map();
        this.memories = new Map();
        this.registerBuiltinJobs();
    }
    registerBuiltinJobs() {
        // Health check all agents every 5 minutes
        this.addJob('health-check', 5 * 60 * 1000, async () => {
            await this.manager.checkAllHealth();
            this.logger.debug('Periodic health check complete');
        });
        // Cache eviction every 10 minutes
        this.addJob('cache-eviction', 10 * 60 * 1000, async () => {
            let total = 0;
            for (const mem of this.memories.values()) {
                total += mem.evictExpired();
            }
            if (total > 0)
                this.logger.debug(`Evicted ${total} expired cache entries`);
        });
    }
    addJob(id, intervalMs, run) {
        this.jobs.set(id, { id, intervalMs, lastRanAt: 0, run });
    }
    removeJob(id) {
        this.jobs.delete(id);
    }
    registerMemory(agentId, memory) {
        this.memories.set(agentId, memory);
    }
    /** Call this on each warm-instance request to fire any overdue jobs. */
    async tick() {
        const now = Date.now();
        for (const job of this.jobs.values()) {
            if (now - job.lastRanAt >= job.intervalMs) {
                job.lastRanAt = now;
                try {
                    await job.run();
                }
                catch (err) {
                    this.logger.error(`Scheduled job "${job.id}" failed: ${String(err)}`);
                }
            }
        }
    }
    listJobs() {
        return Array.from(this.jobs.values()).map(({ id, intervalMs, lastRanAt }) => ({
            id,
            intervalMs,
            lastRanAt,
        }));
    }
}
exports.AgentScheduler = AgentScheduler;
//# sourceMappingURL=AgentScheduler.js.map