"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthPluginRegistry = exports.HealthPluginRegistry = void 0;
class HealthPluginRegistry {
    constructor() {
        this.plugins = new Map();
    }
    register(plugin) {
        this.plugins.set(plugin.id, plugin);
    }
    unregister(id) {
        this.plugins.delete(id);
    }
    get(id) {
        return this.plugins.get(id);
    }
    list() {
        return [...this.plugins.values()];
    }
    async installInto(userId, engine) {
        for (const plugin of this.plugins.values()) {
            const diseases = plugin.registerDiseases?.() ?? [];
            for (const d of diseases)
                await engine.registerDisease(userId, d);
            const program = plugin.registerProgram?.();
            if (program)
                await engine.registerProgram(userId, program);
            const rules = plugin.registerProtocols?.() ?? [];
            for (const rule of rules)
                engine.registerDecisionSupportRule(rule);
        }
    }
}
exports.HealthPluginRegistry = HealthPluginRegistry;
exports.healthPluginRegistry = new HealthPluginRegistry();
//# sourceMappingURL=HealthProgramPlugin.js.map