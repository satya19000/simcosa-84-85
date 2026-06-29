"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowLogger = void 0;
/** Per-execution structured logger — mirrors PluginLogger pattern. */
class WorkflowLogger {
    constructor(executionId, workflowId) {
        this.executionId = executionId;
        this.workflowId = workflowId;
        this.entries = [];
        this.maxEntries = 1000;
    }
    debug(message, stepId, data) {
        this.write('debug', message, stepId, data);
    }
    info(message, stepId, data) {
        this.write('info', message, stepId, data);
    }
    warn(message, stepId, data) {
        this.write('warn', message, stepId, data);
    }
    error(message, stepId, data) {
        this.write('error', message, stepId, data);
    }
    write(level, message, stepId, data) {
        const entry = {
            executionId: this.executionId,
            level,
            stepId,
            message,
            timestamp: new Date().toISOString(),
            data,
        };
        this.entries.push(entry);
        if (this.entries.length > this.maxEntries)
            this.entries.shift();
        const prefix = `[Workflow:${this.workflowId}/${this.executionId.slice(0, 8)}]${stepId ? `[${stepId}]` : ''}`;
        switch (level) {
            case 'debug':
                console.debug(prefix, message);
                break;
            case 'info':
                console.info(prefix, message);
                break;
            case 'warn':
                console.warn(prefix, message);
                break;
            case 'error':
                console.error(prefix, message);
                break;
        }
    }
    getEntries(level) {
        return level ? this.entries.filter((e) => e.level === level) : [...this.entries];
    }
    clear() {
        this.entries = [];
    }
}
exports.WorkflowLogger = WorkflowLogger;
//# sourceMappingURL=WorkflowLogger.js.map