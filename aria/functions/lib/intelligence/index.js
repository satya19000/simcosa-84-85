"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConfig = exports.DEFAULT_ENGINE_CONFIG = exports.registerPriorityProvider = exports.registerDecisionProvider = exports.registerMemoryProvider = exports.registerContextProvider = void 0;
exports.runIntelligencePipeline = runIntelligencePipeline;
const ContextEngine_1 = require("./ContextEngine");
const MemoryEngine_1 = require("./MemoryEngine");
const DecisionEngine_1 = require("./DecisionEngine");
const PromptAssembler_1 = require("./PromptAssembler");
const EngineConfig_1 = require("./EngineConfig");
// Re-export extension points so future modules can register without importing internals
var ContextEngine_2 = require("./ContextEngine");
Object.defineProperty(exports, "registerContextProvider", { enumerable: true, get: function () { return ContextEngine_2.registerContextProvider; } });
var MemoryEngine_2 = require("./MemoryEngine");
Object.defineProperty(exports, "registerMemoryProvider", { enumerable: true, get: function () { return MemoryEngine_2.registerMemoryProvider; } });
var DecisionEngine_2 = require("./DecisionEngine");
Object.defineProperty(exports, "registerDecisionProvider", { enumerable: true, get: function () { return DecisionEngine_2.registerDecisionProvider; } });
var PriorityEngine_1 = require("./PriorityEngine");
Object.defineProperty(exports, "registerPriorityProvider", { enumerable: true, get: function () { return PriorityEngine_1.registerPriorityProvider; } });
var EngineConfig_2 = require("./EngineConfig");
Object.defineProperty(exports, "DEFAULT_ENGINE_CONFIG", { enumerable: true, get: function () { return EngineConfig_2.DEFAULT_ENGINE_CONFIG; } });
Object.defineProperty(exports, "resolveConfig", { enumerable: true, get: function () { return EngineConfig_2.resolveConfig; } });
async function runIntelligencePipeline(input) {
    const t0 = Date.now();
    const config = (0, EngineConfig_1.resolveConfig)(input.config);
    // 1. Context Engine
    const { snapshot: context, cacheHit: ctxCacheHit } = await (0, ContextEngine_1.buildContext)(input.userId, input.db, input.history.length, config);
    // 2. Memory Engine (uses context — no extra Firestore reads for built-ins)
    const { blocks: allMemoryBlocks, cacheHits: memCacheHits, cacheMisses: memCacheMisses } = await (0, MemoryEngine_1.buildMemory)(input.userId, input.db, context, input.message, config);
    // 3. Priority Engine is embedded in MemoryEngine (blocks already sorted by priority)
    // 4. Decision Engine
    const decisions = await (0, DecisionEngine_1.generateDecisions)(context, allMemoryBlocks, config);
    // 5. Prompt Assembler
    const assembled = (0, PromptAssembler_1.assemblePrompt)(input.systemBase, context, allMemoryBlocks, decisions, config);
    const executionTimeMs = Date.now() - t0;
    const metrics = {
        executionTimeMs,
        cacheHits: (ctxCacheHit ? 1 : 0) + memCacheHits,
        cacheMisses: (ctxCacheHit ? 0 : 1) + memCacheMisses,
        memoryBlocksTotal: allMemoryBlocks.length,
        memoryBlocksUsed: assembled.memoryBlocksUsed,
        contextSizeChars: context.sizeChars,
        decisionCount: decisions.length,
        promptSizeChars: assembled.sizeChars,
    };
    const output = {
        assembledSystemPrompt: assembled.systemPrompt,
        context,
        memoryBlocks: allMemoryBlocks,
        decisions,
        metrics,
    };
    if (config.debugMode) {
        output.debugSnapshot = {
            userId: input.userId,
            timestamp: new Date().toISOString(),
            metrics,
            promptPreview: assembled.systemPrompt.slice(0, 500),
            memoryBlockTitles: allMemoryBlocks.map((b) => `${b.title} (p:${b.priority})`),
            decisionTitles: decisions.map((d) => `${d.title} (c:${Math.round(d.confidence * 100)}%)`),
        };
    }
    return output;
}
//# sourceMappingURL=index.js.map