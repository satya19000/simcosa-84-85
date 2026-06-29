"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginLogger = void 0;
/** Per-plugin logger. Namespaces all output so plugin logs are easily identifiable. */
class PluginLogger {
    constructor(pluginId) {
        this.pluginId = pluginId;
        this.entries = [];
        this.maxEntries = 500;
    }
    debug(message, data) {
        this.write('debug', message, data);
    }
    info(message, data) {
        this.write('info', message, data);
    }
    warn(message, data) {
        this.write('warn', message, data);
    }
    error(message, data) {
        this.write('error', message, data);
    }
    write(level, message, data) {
        const entry = {
            pluginId: this.pluginId,
            level,
            message,
            timestamp: new Date().toISOString(),
            data,
        };
        this.entries.push(entry);
        if (this.entries.length > this.maxEntries) {
            this.entries.shift();
        }
        const prefix = `[Plugin:${this.pluginId}]`;
        switch (level) {
            case 'debug':
                console.debug(prefix, message, data ?? '');
                break;
            case 'info':
                console.info(prefix, message, data ?? '');
                break;
            case 'warn':
                console.warn(prefix, message, data ?? '');
                break;
            case 'error':
                console.error(prefix, message, data ?? '');
                break;
        }
    }
    getEntries(level) {
        return level ? this.entries.filter((e) => e.level === level) : [...this.entries];
    }
    clearEntries() {
        this.entries = [];
    }
}
exports.PluginLogger = PluginLogger;
//# sourceMappingURL=PluginLogger.js.map