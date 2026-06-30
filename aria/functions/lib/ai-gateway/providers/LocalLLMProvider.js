"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalLLMProvider = void 0;
const ModelCatalog_1 = require("../ModelCatalog");
/**
 * ════════════════════════════════════════════════════════════════════════
 * PLACEHOLDER PROVIDER — NOT FUNCTIONAL.
 *
 * This class exists purely as a structural stub so the rest of the AI
 * Gateway (ProviderRegistry, ModelRouter, ModelPolicyEngine's
 * `localOnlyMode` field, the dashboard's provider list) has a real,
 * type-checked shape to route around. It does NOT call any local model
 * runtime. Every method either reports unavailable or throws a clear,
 * honest "not implemented" error — it never silently no-ops or fabricates
 * a response.
 *
 * To make this real: wire `LOCAL_LLM_ENDPOINT` (an env var already plumbed
 * through but unused below) to an actual local inference server (e.g.
 * Ollama, llama.cpp server, vLLM) and implement complete()/stream() as
 * HTTP calls against it. Until then, ModelRouter must never select this
 * provider for an actual request — ModelCatalog marks its one model entry
 * `isPlaceholder: true` specifically so callers can filter it out.
 * ════════════════════════════════════════════════════════════════════════
 */
class LocalLLMProvider {
    constructor(endpoint) {
        this.endpoint = endpoint;
        this.id = 'local';
        this.catalog = new ModelCatalog_1.ModelCatalogStore();
    }
    async initialize() {
        // No-op — nothing to initialize for a placeholder.
    }
    async healthCheck() {
        return {
            available: false,
            latencyMs: 0,
            error: this.endpoint
                ? 'Local LLM endpoint configured but LocalLLMProvider is a placeholder — not implemented'
                : 'Local LLM not configured (placeholder provider)',
        };
    }
    listModels() {
        return this.catalog.byProvider('local');
    }
    async complete(_prompt, _options) {
        throw new Error('LocalLLMProvider is a placeholder and cannot serve completions yet.');
    }
    async stream(_prompt, _options, _onChunk) {
        throw new Error('LocalLLMProvider is a placeholder and cannot stream completions yet.');
    }
    estimateCost() {
        return 0;
    }
    async shutdown() { }
}
exports.LocalLLMProvider = LocalLLMProvider;
//# sourceMappingURL=LocalLLMProvider.js.map