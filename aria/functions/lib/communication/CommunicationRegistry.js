"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationRegistry = void 0;
exports.registerProvider = registerProvider;
exports.getProvider = getProvider;
exports.getProviderByType = getProviderByType;
exports.listProviders = listProviders;
exports.unregisterProvider = unregisterProvider;
const CommunicationProvider_1 = require("./CommunicationProvider");
// ── Registry ──────────────────────────────────────────────────────────────────
// Providers register themselves here. The engine looks up by id or type.
// Plugins may call registerProvider() at startup.
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
// ── Placeholder providers registered at boot ─────────────────────────────────
// Real providers replace these when a plugin is loaded.
const PLACEHOLDER_TYPES = [
    'email', 'whatsapp', 'sms', 'phone', 'telegram',
    'signal', 'slack', 'teams', 'google_chat',
];
function labelFor(type) {
    const labels = {
        email: 'Email', whatsapp: 'WhatsApp', sms: 'SMS', phone: 'Phone',
        telegram: 'Telegram', signal: 'Signal', slack: 'Slack',
        teams: 'Microsoft Teams', google_chat: 'Google Chat', custom: 'Custom',
    };
    return labels[type];
}
for (const type of PLACEHOLDER_TYPES) {
    registerProvider(new CommunicationProvider_1.NoOpProvider(type, labelFor(type), type));
}
class CommunicationRegistry {
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
exports.CommunicationRegistry = CommunicationRegistry;
//# sourceMappingURL=CommunicationRegistry.js.map