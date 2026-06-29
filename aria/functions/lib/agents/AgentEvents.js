"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentEventBus = exports.AgentEventBus = void 0;
/** Lightweight in-process event bus for agent coordination. No direct coupling. */
class AgentEventBus {
    constructor() {
        this.handlers = new Map();
    }
    on(event, handler) {
        const set = this.handlers.get(event) ?? new Set();
        set.add(handler);
        this.handlers.set(event, set);
        return () => this.handlers.get(event)?.delete(handler);
    }
    async emit(name, agentId, data, opts) {
        const event = {
            name,
            agentId,
            taskId: opts?.taskId,
            graphRunId: opts?.graphRunId,
            userId: opts?.userId,
            timestamp: new Date().toISOString(),
            data,
        };
        const handlers = this.handlers.get(name);
        if (!handlers || handlers.size === 0)
            return;
        await Promise.allSettled(Array.from(handlers).map((h) => h(event)));
    }
    listSubscriptions() {
        const out = {};
        for (const [name, set] of this.handlers)
            out[name] = set.size;
        return out;
    }
}
exports.AgentEventBus = AgentEventBus;
exports.agentEventBus = new AgentEventBus();
//# sourceMappingURL=AgentEvents.js.map