"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ENGINE_CONFIG = void 0;
exports.resolveConfig = resolveConfig;
exports.DEFAULT_ENGINE_CONFIG = {
    maxPromptChars: 24000,
    maxMemoryBlocks: 12,
    cacheTTLMs: 60000,
    maxRecommendations: 5,
    maxConversationMessages: 20,
    timezoneFallback: 'Asia/Kolkata',
    debugMode: false,
};
function resolveConfig(override) {
    return { ...exports.DEFAULT_ENGINE_CONFIG, ...override };
}
//# sourceMappingURL=EngineConfig.js.map