"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionManager = exports.CAPABILITY_PERMISSIONS = void 0;
/** Authoritative mapping: capability → minimum required permissions. */
exports.CAPABILITY_PERMISSIONS = {
    chat: ['ai_access'],
    voice: ['microphone', 'ai_access'],
    calendar: ['read:calendar'],
    contacts: ['read:contacts'],
    tasks: ['read:tasks'],
    notifications: ['notifications'],
    maps: ['location', 'network'],
    documents: ['documents'],
    email: ['network', 'read:contacts'],
    sms: ['network'],
    phone: ['network'],
    camera: ['camera'],
    storage: ['read:notes', 'write:notes'],
    network: ['network'],
    health: ['filesystem'],
    finance: ['filesystem'],
    automation: ['ai_access', 'write:tasks'],
    ai_access: ['ai_access'],
};
/**
 * Tracks which permissions have been granted or denied for each plugin.
 * Held in-memory by PluginRuntime — no plugin may bypass this.
 */
class PermissionManager {
    constructor() {
        this.grants = new Map();
    }
    /** Auto-grant all permissions implied by the plugin's declared capabilities. */
    grantForCapabilities(pluginId, capabilities) {
        const required = new Set();
        for (const cap of capabilities) {
            for (const perm of exports.CAPABILITY_PERMISSIONS[cap] ?? []) {
                required.add(perm);
            }
        }
        const pluginGrants = this.grants.get(pluginId) ?? new Map();
        const now = new Date().toISOString();
        for (const perm of required) {
            pluginGrants.set(perm, { permission: perm, granted: true, grantedAt: now });
        }
        this.grants.set(pluginId, pluginGrants);
    }
    grant(pluginId, permission, reason) {
        const pluginGrants = this.grants.get(pluginId) ?? new Map();
        pluginGrants.set(permission, {
            permission,
            granted: true,
            grantedAt: new Date().toISOString(),
            reason,
        });
        this.grants.set(pluginId, pluginGrants);
    }
    revoke(pluginId, permission, reason) {
        const existing = this.grants.get(pluginId)?.get(permission);
        if (existing) {
            const pluginGrants = this.grants.get(pluginId);
            pluginGrants.set(permission, {
                ...existing,
                granted: false,
                revokedAt: new Date().toISOString(),
                reason,
            });
        }
    }
    has(pluginId, permission) {
        return this.grants.get(pluginId)?.get(permission)?.granted === true;
    }
    getGrants(pluginId) {
        return Array.from(this.grants.get(pluginId)?.values() ?? []);
    }
    clear(pluginId) {
        this.grants.delete(pluginId);
    }
}
exports.PermissionManager = PermissionManager;
//# sourceMappingURL=PluginPermissions.js.map