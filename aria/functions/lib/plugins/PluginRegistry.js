"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginRegistry = void 0;
class PluginRegistry {
    constructor() {
        this.plugins = new Map();
        this.records = new Map();
    }
    register(plugin) {
        const { id } = plugin.manifest;
        if (this.plugins.has(id)) {
            throw new Error(`Plugin "${id}" is already registered`);
        }
        this.plugins.set(id, plugin);
        this.records.set(id, {
            pluginId: id,
            status: 'installed',
            installedAt: new Date().toISOString(),
            version: plugin.manifest.version,
        });
    }
    unregister(pluginId) {
        if (!this.plugins.has(pluginId)) {
            throw new Error(`Plugin "${pluginId}" is not registered`);
        }
        this.plugins.delete(pluginId);
        this.records.delete(pluginId);
    }
    get(pluginId) {
        return this.plugins.get(pluginId);
    }
    getRecord(pluginId) {
        return this.records.get(pluginId);
    }
    setStatus(pluginId, status, error) {
        const record = this.records.get(pluginId);
        if (!record)
            return;
        record.status = status;
        if (status === 'enabled')
            record.enabledAt = new Date().toISOString();
        if (status === 'disabled')
            record.disabledAt = new Date().toISOString();
        if (error)
            record.errorMessage = error;
    }
    listPlugins() {
        return Array.from(this.records.values());
    }
    listEnabled() {
        return Array.from(this.records.values())
            .filter((r) => r.status === 'enabled')
            .map((r) => this.plugins.get(r.pluginId))
            .filter((p) => p !== undefined);
    }
    searchPlugins(query) {
        const q = query.toLowerCase();
        return this.listPlugins().filter((r) => {
            const plugin = this.plugins.get(r.pluginId);
            if (!plugin)
                return false;
            return (plugin.manifest.name.toLowerCase().includes(q) ||
                plugin.manifest.description.toLowerCase().includes(q) ||
                plugin.manifest.capabilities.some((c) => c.toLowerCase().includes(q)));
        });
    }
    has(pluginId) {
        return this.plugins.has(pluginId);
    }
    size() {
        return this.plugins.size;
    }
}
exports.PluginRegistry = PluginRegistry;
//# sourceMappingURL=PluginRegistry.js.map