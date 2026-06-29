"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginRuntime = void 0;
const PluginRegistry_1 = require("./PluginRegistry");
const PluginLoader_1 = require("./PluginLoader");
const PluginLogger_1 = require("./PluginLogger");
const PluginMetrics_1 = require("./PluginMetrics");
const PluginConfig_1 = require("./PluginConfig");
const PluginPermissions_1 = require("./PluginPermissions");
const CapabilityManager_1 = require("./CapabilityManager");
const PluginEvents_1 = require("./PluginEvents");
const PluginContext_1 = require("./PluginContext");
class PluginRuntime {
    constructor(db) {
        this.db = db;
        this.registry = new PluginRegistry_1.PluginRegistry();
        this.runtimeLogger = new PluginLogger_1.PluginLogger('plugin-runtime');
        this.metricsMap = new Map();
        this.loggersMap = new Map();
        this.healthCache = new Map();
        this.loader = new PluginLoader_1.PluginLoader(this.registry, this.runtimeLogger);
    }
    buildContext(pluginId, userId) {
        const logger = this.loggersMap.get(pluginId) ?? new PluginLogger_1.PluginLogger(pluginId);
        this.loggersMap.set(pluginId, logger);
        const metrics = this.metricsMap.get(pluginId) ?? new PluginMetrics_1.PluginMetrics(pluginId);
        this.metricsMap.set(pluginId, metrics);
        const config = new PluginConfig_1.PluginConfig(pluginId, this.db);
        const permissionManager = new PluginPermissions_1.PermissionManager();
        const plugin = this.registry.get(pluginId);
        if (plugin) {
            permissionManager.grantForCapabilities(pluginId, plugin.manifest.capabilities);
        }
        const capabilities = new CapabilityManager_1.CapabilityManager(permissionManager);
        return (0, PluginContext_1.buildPluginContext)(pluginId, userId, this.db, logger, PluginEvents_1.pluginEventBus, config, metrics, capabilities);
    }
    async loadPlugin(plugin, userId) {
        const { id } = plugin.manifest;
        const start = Date.now();
        const ctx = this.buildContext(id, userId);
        await this.loader.install(plugin, ctx);
        await this.loader.initialize(id, ctx);
        await this.loader.enable(id);
        this.metricsMap.get(id)?.recordStartup(Date.now() - start);
        await PluginEvents_1.pluginEventBus.emit('plugin:enabled', id, { pluginId: id }, userId);
    }
    async unloadPlugin(pluginId) {
        await this.loader.disable(pluginId);
        await this.loader.shutdown(pluginId);
        await PluginEvents_1.pluginEventBus.emit('plugin:disabled', pluginId, { pluginId });
    }
    async restartPlugin(pluginId, userId) {
        const plugin = this.registry.get(pluginId);
        if (!plugin)
            throw new Error(`Plugin "${pluginId}" not found`);
        await this.unloadPlugin(pluginId);
        this.registry.unregister(pluginId);
        await this.loadPlugin(plugin, userId);
    }
    async recoverFailed(userId) {
        const failed = this.registry.listPlugins().filter((r) => r.status === 'error');
        for (const record of failed) {
            try {
                this.runtimeLogger.warn(`Recovering failed plugin "${record.pluginId}"`);
                await this.restartPlugin(record.pluginId, userId);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                this.runtimeLogger.error(`Recovery failed for "${record.pluginId}": ${msg}`);
                await PluginEvents_1.pluginEventBus.emit('plugin:error', record.pluginId, { pluginId: record.pluginId, error: msg });
            }
        }
    }
    async getHealth(userId) {
        const records = this.registry.listPlugins();
        const pluginItems = await Promise.all(records.map(async (record) => {
            if (record.status !== 'enabled') {
                return {
                    id: record.pluginId,
                    name: this.registry.get(record.pluginId)?.manifest.name ?? record.pluginId,
                    status: record.status,
                    healthy: null,
                    lastErrorMessage: record.errorMessage ?? null,
                };
            }
            const cached = this.healthCache.get(record.pluginId);
            if (cached && Date.now() - cached.checkedAt < 30000) {
                return {
                    id: record.pluginId,
                    name: this.registry.get(record.pluginId)?.manifest.name ?? record.pluginId,
                    status: record.status,
                    healthy: cached.healthy,
                    lastErrorMessage: record.errorMessage ?? null,
                };
            }
            try {
                const plugin = this.registry.get(record.pluginId);
                const result = await Promise.race([
                    plugin.healthCheck(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
                ]);
                this.healthCache.set(record.pluginId, { healthy: result.healthy, checkedAt: Date.now() });
                return {
                    id: record.pluginId,
                    name: plugin.manifest.name,
                    status: record.status,
                    healthy: result.healthy,
                    lastErrorMessage: record.errorMessage ?? null,
                };
            }
            catch {
                this.healthCache.set(record.pluginId, { healthy: false, checkedAt: Date.now() });
                return {
                    id: record.pluginId,
                    name: this.registry.get(record.pluginId)?.manifest.name ?? record.pluginId,
                    status: record.status,
                    healthy: false,
                    lastErrorMessage: record.errorMessage ?? null,
                };
            }
        }));
        return {
            totalPlugins: records.length,
            enabledPlugins: records.filter((r) => r.status === 'enabled').length,
            errorPlugins: records.filter((r) => r.status === 'error').length,
            plugins: pluginItems,
        };
    }
    getAllToolDefinitions() {
        const tools = [];
        for (const plugin of this.registry.listEnabled()) {
            if (plugin.getToolDefinitions) {
                tools.push(...plugin.getToolDefinitions());
            }
        }
        return tools;
    }
    async executeTool(toolName, args, userId) {
        for (const plugin of this.registry.listEnabled()) {
            const defs = plugin.getToolDefinitions?.() ?? [];
            if (defs.some((d) => d.name === toolName)) {
                if (!plugin.executeTool) {
                    return { success: false, message: `Plugin "${plugin.manifest.id}" does not implement executeTool`, error: 'not_implemented' };
                }
                const ctx = this.buildContext(plugin.manifest.id, userId);
                const metrics = this.metricsMap.get(plugin.manifest.id);
                const start = Date.now();
                try {
                    const result = await plugin.executeTool(toolName, args, ctx);
                    metrics?.recordExecution(Date.now() - start);
                    metrics?.recordApiCall();
                    return result;
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    metrics?.recordError(msg);
                    return { success: false, message: msg, error: msg };
                }
            }
        }
        return { success: false, message: `No plugin found for tool "${toolName}"`, error: 'not_found' };
    }
    getAllMemoryProviders() {
        const providers = [];
        for (const plugin of this.registry.listEnabled()) {
            if (plugin.getMemoryProviders) {
                providers.push(...plugin.getMemoryProviders());
            }
        }
        return providers;
    }
    getMetrics(pluginId) {
        return this.metricsMap.get(pluginId)?.snapshot() ?? null;
    }
    getAllMetrics() {
        return Array.from(this.metricsMap.entries()).map(([, m]) => m.snapshot());
    }
    listPlugins() {
        return this.registry.listPlugins();
    }
    searchPlugins(query) {
        return this.registry.searchPlugins(query);
    }
}
exports.PluginRuntime = PluginRuntime;
//# sourceMappingURL=PluginRuntime.js.map