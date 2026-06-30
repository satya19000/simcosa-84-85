"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financePluginRegistry = exports.FinancePluginRegistry = void 0;
class FinancePluginRegistry {
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
        void userId;
        void engine;
        // Plugins register declaratively; core engine has no concrete hooks to
        // call into yet beyond exposing the registry for consumers to query.
        for (const plugin of this.plugins.values()) {
            plugin.registerFinancialModules?.();
            plugin.registerProcurementWorkflows?.();
            plugin.registerComplianceRules?.();
            plugin.registerApprovalChains?.();
        }
    }
}
exports.FinancePluginRegistry = FinancePluginRegistry;
exports.financePluginRegistry = new FinancePluginRegistry();
//# sourceMappingURL=FinanceProgramPlugin.js.map