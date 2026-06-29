"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRouter = void 0;
const AgentLogger_1 = require("./AgentLogger");
/**
 * Routes tasks to the best available agent based on capability, health, and load.
 * No switch statements — pure capability-based lookup through the registry.
 */
class TaskRouter {
    constructor(registry, health) {
        this.registry = registry;
        this.health = health;
        this.logger = new AgentLogger_1.AgentLogger('task-router');
    }
    /** Find the best healthy agent for a task. Returns undefined if none available. */
    route(task) {
        const candidates = this.registry.getByCapability(task.capability);
        if (candidates.length === 0) {
            this.logger.warn(`No agents registered for capability "${task.capability}"`, task.taskId);
            return undefined;
        }
        // Filter to healthy agents
        const healthy = candidates.filter((a) => this.health.isHealthy(a.manifest.id));
        // Further filter to those that can handle this specific task
        const capable = (healthy.length > 0 ? healthy : candidates).filter((a) => a.canHandle(task));
        if (capable.length === 0) {
            this.logger.warn(`No capable agents for task "${task.taskId}" (capability: ${task.capability})`, task.taskId);
            return undefined;
        }
        // Pick least-busy (idle > busy) then alphabetical for determinism
        const selected = this.selectBest(capable);
        const decision = {
            task: { ...task, assignedAgent: selected.manifest.id },
            agentId: selected.manifest.id,
            strategy: 'single',
            reason: `Selected "${selected.manifest.name}" for capability "${task.capability}"`,
        };
        this.logger.info(`Routed task ${task.taskId} → ${selected.manifest.id}`, task.taskId);
        return decision;
    }
    /** Route multiple tasks, returning routing decisions for all. */
    routeAll(tasks) {
        const decisions = new Map();
        for (const task of tasks) {
            const decision = this.route(task);
            if (decision) {
                decisions.set(task.taskId, decision);
            }
        }
        return decisions;
    }
    selectBest(agents) {
        // Prefer idle agents; within the same status, prefer alphabetical ID for determinism
        return agents.sort((a, b) => {
            if (a.status === 'idle' && b.status !== 'idle')
                return -1;
            if (b.status === 'idle' && a.status !== 'idle')
                return 1;
            return a.manifest.id.localeCompare(b.manifest.id);
        })[0];
    }
}
exports.TaskRouter = TaskRouter;
//# sourceMappingURL=TaskRouter.js.map