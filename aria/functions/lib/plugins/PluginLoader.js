"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginLoader = void 0;
class PluginLoader {
    constructor(registry, logger) {
        this.registry = registry;
        this.logger = logger;
    }
    async install(plugin, ctx) {
        const { id } = plugin.manifest;
        try {
            this.registry.register(plugin);
            await plugin.install(ctx);
            this.logger.info(`Plugin "${id}" installed`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.registry.setStatus(id, 'error', msg);
            this.logger.error(`Plugin "${id}" install failed: ${msg}`);
            throw err;
        }
    }
    async initialize(pluginId, ctx) {
        const plugin = this.registry.get(pluginId);
        if (!plugin)
            throw new Error(`Plugin "${pluginId}" not found`);
        try {
            await plugin.initialize(ctx);
            this.logger.info(`Plugin "${pluginId}" initialized`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.registry.setStatus(pluginId, 'error', msg);
            this.logger.error(`Plugin "${pluginId}" initialize failed: ${msg}`);
            throw err;
        }
    }
    async enable(pluginId) {
        const plugin = this.registry.get(pluginId);
        if (!plugin)
            throw new Error(`Plugin "${pluginId}" not found`);
        try {
            await plugin.enable();
            this.registry.setStatus(pluginId, 'enabled');
            this.logger.info(`Plugin "${pluginId}" enabled`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.registry.setStatus(pluginId, 'error', msg);
            this.logger.error(`Plugin "${pluginId}" enable failed: ${msg}`);
            throw err;
        }
    }
    async disable(pluginId) {
        const plugin = this.registry.get(pluginId);
        if (!plugin)
            throw new Error(`Plugin "${pluginId}" not found`);
        try {
            await plugin.disable();
            this.registry.setStatus(pluginId, 'disabled');
            this.logger.info(`Plugin "${pluginId}" disabled`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.registry.setStatus(pluginId, 'error', msg);
            this.logger.error(`Plugin "${pluginId}" disable failed: ${msg}`);
        }
    }
    async shutdown(pluginId) {
        const plugin = this.registry.get(pluginId);
        if (!plugin)
            return;
        try {
            await plugin.shutdown();
            this.logger.info(`Plugin "${pluginId}" shut down`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(`Plugin "${pluginId}" shutdown failed: ${msg}`);
        }
    }
    async upgrade(pluginId, previousVersion, ctx) {
        const plugin = this.registry.get(pluginId);
        if (!plugin)
            throw new Error(`Plugin "${pluginId}" not found`);
        try {
            await plugin.upgrade(previousVersion, ctx);
            this.logger.info(`Plugin "${pluginId}" upgraded from ${previousVersion}`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.registry.setStatus(pluginId, 'error', msg);
            this.logger.error(`Plugin "${pluginId}" upgrade failed: ${msg}`);
            throw err;
        }
    }
}
exports.PluginLoader = PluginLoader;
//# sourceMappingURL=PluginLoader.js.map