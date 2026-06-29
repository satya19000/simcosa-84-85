"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentLogger = void 0;
/** Per-agent structured logger — mirrors PluginLogger and WorkflowLogger pattern. */
class AgentLogger {
    constructor(agentId) {
        this.agentId = agentId;
        this.entries = [];
        this.maxEntries = 500;
    }
    debug(message, taskId, data) { this.write('debug', message, taskId, data); }
    info(message, taskId, data) { this.write('info', message, taskId, data); }
    warn(message, taskId, data) { this.write('warn', message, taskId, data); }
    error(message, taskId, data) { this.write('error', message, taskId, data); }
    write(level, message, taskId, data) {
        const entry = {
            agentId: this.agentId,
            taskId,
            level,
            message,
            timestamp: new Date().toISOString(),
            data,
        };
        this.entries.push(entry);
        if (this.entries.length > this.maxEntries)
            this.entries.shift();
        const tag = `[Agent:${this.agentId}]${taskId ? `[${taskId.slice(0, 8)}]` : ''}`;
        switch (level) {
            case 'debug':
                console.debug(tag, message);
                break;
            case 'info':
                console.info(tag, message);
                break;
            case 'warn':
                console.warn(tag, message);
                break;
            case 'error':
                console.error(tag, message);
                break;
        }
    }
    getEntries(level) {
        return level ? this.entries.filter((e) => e.level === level) : [...this.entries];
    }
    clear() { this.entries = []; }
}
exports.AgentLogger = AgentLogger;
//# sourceMappingURL=AgentLogger.js.map