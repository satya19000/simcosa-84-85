"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentEvents = void 0;
class DocumentEventBus {
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
    async emit(name, documentId, userId, payload) {
        const event = { name, documentId, userId, payload, emittedAt: new Date().toISOString() };
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
exports.DocumentEvents = new DocumentEventBus();
//# sourceMappingURL=DocumentEvents.js.map