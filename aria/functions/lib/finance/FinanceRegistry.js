"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceRegistry = void 0;
exports.registerProvider = registerProvider;
exports.getProvider = getProvider;
exports.getProviderByType = getProviderByType;
exports.listProviders = listProviders;
exports.unregisterProvider = unregisterProvider;
// ── Registry ──────────────────────────────────────────────────────────────────
// Financial data providers (banks, UPI, credit cards, accounting systems, ERP,
// government finance APIs) register themselves here. No vendor is ever
// referenced by the core engine. No placeholders pre-registered — providers
// are vendor-specific, not a fixed enumerable channel set.
const providers = new Map();
function registerProvider(provider) {
    providers.set(provider.id, provider);
}
function getProvider(id) {
    return providers.get(id);
}
function getProviderByType(type) {
    for (const p of providers.values()) {
        if (p.type === type)
            return p;
    }
    return undefined;
}
function listProviders() {
    return [...providers.values()];
}
function unregisterProvider(id) {
    providers.delete(id);
}
class FinanceRegistry {
    registerProvider(provider) {
        registerProvider(provider);
    }
    getProvider(id) {
        return getProvider(id);
    }
    getProviderByType(type) {
        return getProviderByType(type);
    }
    listProviders() {
        return listProviders();
    }
    listRegistered() {
        return this.listProviders().map((p) => ({ id: p.id, name: p.name, type: p.type }));
    }
}
exports.FinanceRegistry = FinanceRegistry;
//# sourceMappingURL=FinanceRegistry.js.map