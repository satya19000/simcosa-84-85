"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryEvents = void 0;
class MemoryEventBus {
    constructor() {
        this.handlers = new Map();
    }
    on(event, handler) {
        const list = this.handlers.get(event) ?? [];
        list.push(handler);
        this.handlers.set(event, list);
        return () => {
            const updated = (this.handlers.get(event) ?? []).filter((h) => h !== handler);
            this.handlers.set(event, updated);
        };
    }
    async emit(name, userId, payload) {
        const event = { name, userId, payload, emittedAt: new Date().toISOString() };
        const handlers = this.handlers.get(name) ?? [];
        await Promise.all(handlers.map((h) => h(event)));
    }
    listSubscriptions() {
        const result = {};
        for (const [name, handlers] of this.handlers) {
            result[name] = handlers.length;
        }
        return result;
    }
}
exports.MemoryEvents = new MemoryEventBus();
//# sourceMappingURL=MemoryEvents.js.map