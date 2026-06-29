"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MEMORY_CONFIG = void 0;
exports.resolveMemoryConfig = resolveMemoryConfig;
exports.DEFAULT_MEMORY_CONFIG = {
    maxSearchResults: 20,
    defaultTraversalDepth: 3,
    compressionThreshold: 30,
    compressionTokenBudget: 4000,
    indexCacheTTLMs: 5 * 60 * 1000,
    minEdgeConfidence: 0.6,
    analyticsEnabled: true,
    recencyDecayPerDay: 2,
};
function resolveMemoryConfig(override) {
    return { ...exports.DEFAULT_MEMORY_CONFIG, ...override };
}
//# sourceMappingURL=MemoryConfig.js.map