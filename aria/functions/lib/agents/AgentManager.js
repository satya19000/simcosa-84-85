"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentManager = void 0;
const AgentMetrics_1 = require("./AgentMetrics");
const AgentLogger_1 = require("./AgentLogger");
const AgentEvents_1 = require("./AgentEvents");
const AgentConfig_1 = require("./AgentConfig");
class AgentManager {
    constructor(registry, health, config) {
        this.registry = registry;
        this.health = health;
        this.logger = new AgentLogger_1.AgentLogger('agent-manager');
        this.metrics = new Map();
        this.config = (0, AgentConfig_1.resolveAgentConfig)(config);
    }
    /** Register and initialize an agent. */
    async register(agent) {
        if (this.registry.has(agent.manifest.id)) {
            this.logger.warn(`Agent "${agent.manifest.id}" already registered — skipping`);
            return;
        }
        agent.status = 'initializing';
        this.registry.register(agent);
        this.health.register(agent.manifest.id);
        this.metrics.set(agent.manifest.id, new AgentMetrics_1.AgentMetrics(agent.manifest.id));
        try {
            await agent.initialize(this.config);
            agent.status = 'idle';
            this.logger.info(`Agent "${agent.manifest.id}" registered and initialized`);
            await AgentEvents_1.agentEventBus.emit('agent:registered', agent.manifest.id, { manifest: agent.manifest });
        }
        catch (err) {
            agent.status = 'error';
            this.logger.error(`Agent "${agent.manifest.id}" failed to initialize: ${String(err)}`);
        }
    }
    /** Register multiple agents in parallel. */
    async registerAll(agents) {
        await Promise.all(agents.map((a) => this.register(a)));
    }
    /** Gracefully shut down and unregister an agent. */
    async unregister(agentId) {
        const agent = this.registry.get(agentId);
        if (!agent)
            return;
        try {
            agent.status = 'shutdown';
            await agent.shutdown();
        }
        catch (err) {
            this.logger.warn(`Agent "${agentId}" shutdown error: ${String(err)}`);
        }
        this.registry.unregister(agentId);
        this.metrics.delete(agentId);
        this.logger.info(`Agent "${agentId}" unregistered`);
    }
    /** Disable an agent without unregistering (keeps manifest). */
    disable(agentId) {
        const agent = this.registry.get(agentId);
        if (agent) {
            agent.status = 'disabled';
            this.logger.info(`Agent "${agentId}" disabled`);
        }
    }
    /** Re-enable a previously disabled agent. */
    enable(agentId) {
        const agent = this.registry.get(agentId);
        if (agent && agent.status === 'disabled') {
            agent.status = 'idle';
            this.logger.info(`Agent "${agentId}" enabled`);
        }
    }
    /** Run a health check on a single agent and record the result. */
    async checkHealth(agentId) {
        const agent = this.registry.get(agentId);
        if (!agent)
            return;
        try {
            const snapshot = await agent.healthCheck();
            this.health.record(snapshot);
            if (!snapshot.healthy) {
                this.logger.warn(`Agent "${agentId}" health degraded: ${snapshot.message ?? 'unknown'}`);
                await AgentEvents_1.agentEventBus.emit('agent:health:degraded', agentId, snapshot);
            }
        }
        catch (err) {
            this.health.record({
                agentId,
                status: 'error',
                healthy: false,
                lastCheckedAt: new Date().toISOString(),
                responseTimeMs: 0,
                message: String(err),
            });
        }
    }
    /** Run health checks on all registered agents. */
    async checkAllHealth() {
        const agents = this.registry.listAll();
        await Promise.all(agents.map((a) => this.checkHealth(a.manifest.id)));
    }
    /** Restart a failed agent: shut down then re-initialize. */
    async restart(agentId) {
        const agent = this.registry.get(agentId);
        if (!agent)
            return;
        this.logger.info(`Restarting agent "${agentId}"`);
        try {
            await agent.shutdown();
        }
        catch (_) {
            // best-effort
        }
        agent.status = 'initializing';
        try {
            await agent.initialize(this.config);
            agent.status = 'idle';
            this.logger.info(`Agent "${agentId}" restarted successfully`);
        }
        catch (err) {
            agent.status = 'error';
            this.logger.error(`Agent "${agentId}" failed to restart: ${String(err)}`);
        }
    }
    getMetrics(agentId) {
        return this.metrics.get(agentId);
    }
    stats() {
        const all = this.registry.listAll();
        return {
            total: all.length,
            idle: all.filter((a) => a.status === 'idle').length,
            busy: all.filter((a) => a.status === 'busy').length,
            error: all.filter((a) => a.status === 'error').length,
            disabled: all.filter((a) => a.status === 'disabled').length,
        };
    }
    listManifests() {
        return this.registry.listManifests();
    }
}
exports.AgentManager = AgentManager;
//# sourceMappingURL=AgentManager.js.map