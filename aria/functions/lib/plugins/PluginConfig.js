"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginConfig = void 0;
/**
 * Per-plugin configuration store.
 * Global settings live at: plugins/{pluginId}/config/settings
 * User settings live at: users/{userId}/plugins/{pluginId}/config
 */
class PluginConfig {
    constructor(pluginId, db) {
        this.pluginId = pluginId;
        this.db = db;
    }
    /** Load a user-scoped setting. Returns defaultValue if not set. */
    async get(userId, key, defaultValue) {
        try {
            const snap = await this.db
                .collection('users')
                .doc(userId)
                .collection('plugins')
                .doc(this.pluginId)
                .collection('config')
                .doc('settings')
                .get();
            if (!snap.exists)
                return defaultValue;
            const value = snap.data()?.[key];
            return value !== undefined ? value : defaultValue;
        }
        catch {
            return defaultValue;
        }
    }
    /** Save a user-scoped setting. */
    async set(userId, key, value) {
        await this.db
            .collection('users')
            .doc(userId)
            .collection('plugins')
            .doc(this.pluginId)
            .collection('config')
            .doc('settings')
            .set({ [key]: value }, { merge: true });
    }
    /** Load all user settings as a flat object. */
    async getAll(userId) {
        try {
            const snap = await this.db
                .collection('users')
                .doc(userId)
                .collection('plugins')
                .doc(this.pluginId)
                .collection('config')
                .doc('settings')
                .get();
            return snap.exists ? (snap.data() ?? {}) : {};
        }
        catch {
            return {};
        }
    }
}
exports.PluginConfig = PluginConfig;
//# sourceMappingURL=PluginConfig.js.map