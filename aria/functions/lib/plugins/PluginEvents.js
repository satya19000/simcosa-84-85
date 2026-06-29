"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginEventBus = exports.PluginEventBus = void 0;
/**
 * Lightweight in-process event bus.
 * Plugins communicate through events; never through direct references.
 */
class PluginEventBus {
    constructor() {
        this.handlers = new Map();
    }
    on(eventName, handler) {
        const set = this.handlers.get(eventName) ?? new Set();
        set.add(handler);
        this.handlers.set(eventName, set);
        // Return unsubscribe function
        return () => {
            this.handlers.get(eventName)?.delete(handler);
        };
    }
    async emit(eventName, pluginId, data, userId) {
        const event = {
            name: eventName,
            pluginId,
            userId,
            timestamp: new Date().toISOString(),
            data,
        };
        const handlers = this.handlers.get(eventName);
        if (!handlers || handlers.size === 0)
            return;
        await Promise.allSettled(Array.from(handlers).map((handler) => handler(event)));
    }
    off(eventName, handler) {
        this.handlers.get(eventName)?.delete(handler);
    }
    listSubscriptions() {
        const result = {};
        for (const [name, set] of this.handlers.entries()) {
            result[name] = set.size;
        }
        return result;
    }
}
exports.PluginEventBus = PluginEventBus;
/** Singleton event bus shared across the plugin runtime. */
exports.pluginEventBus = new PluginEventBus();
//# sourceMappingURL=PluginEvents.js.map