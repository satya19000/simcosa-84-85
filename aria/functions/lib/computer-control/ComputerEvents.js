"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerEvents = void 0;
/**
 * In-process event bus for computer-control events.
 * Mirrors SkillEvents's pattern.
 */
class ComputerEvents {
    constructor() {
        this.listeners = new Map();
    }
    on(name, listener) {
        const existing = this.listeners.get(name) ?? [];
        this.listeners.set(name, [...existing, listener]);
    }
    emit(name, userId, capabilityId, payload = {}) {
        const event = { name, userId, capabilityId, payload, emittedAt: new Date().toISOString() };
        const handlers = this.listeners.get(name) ?? [];
        for (const handler of handlers) {
            try {
                handler(event);
            }
            catch { /* best-effort */ }
        }
    }
}
exports.ComputerEvents = ComputerEvents;
//# sourceMappingURL=ComputerEvents.js.map