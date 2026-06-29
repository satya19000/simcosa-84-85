"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_AGENT_CONFIG = void 0;
exports.resolveAgentConfig = resolveAgentConfig;
exports.DEFAULT_AGENT_CONFIG = {
    maxConcurrency: 5,
    taskTimeoutMs: 30000,
    maxRetries: 2,
    retryDelayMs: 1000,
    cacheTTLMs: 60000,
    debugMode: false,
};
function resolveAgentConfig(override) {
    return { ...exports.DEFAULT_AGENT_CONFIG, ...override };
}
//# sourceMappingURL=AgentConfig.js.map