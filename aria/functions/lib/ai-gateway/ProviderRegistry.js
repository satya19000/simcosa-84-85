"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderRegistry = void 0;
const ClaudeProvider_1 = require("./providers/ClaudeProvider");
const OpenAIProvider_1 = require("./providers/OpenAIProvider");
const GeminiProvider_1 = require("./providers/GeminiProvider");
const OpenRouterProvider_1 = require("./providers/OpenRouterProvider");
const LocalLLMProvider_1 = require("./providers/LocalLLMProvider");
/**
 * Composition root for all ModelProvider implementations. Plugin-first: to
 * add a new provider, implement ModelProvider and register it here — no
 * other module needs to change. ModelRouter/AIGateway only ever talk to
 * providers through this registry, never import a provider class directly.
 */
class ProviderRegistry {
    constructor(keys) {
        this.providers = new Map();
        this.initialized = false;
        this.providers.set('claude', new ClaudeProvider_1.ClaudeProvider(keys.anthropicApiKey));
        this.providers.set('openai', new OpenAIProvider_1.OpenAIProvider(keys.openaiApiKey));
        this.providers.set('gemini', new GeminiProvider_1.GeminiProvider(keys.geminiApiKey));
        this.providers.set('openrouter', new OpenRouterProvider_1.OpenRouterProvider(keys.openrouterApiKey));
        this.providers.set('local', new LocalLLMProvider_1.LocalLLMProvider(keys.localLlmEndpoint));
    }
    async initializeAll() {
        if (this.initialized)
            return;
        await Promise.all(Array.from(this.providers.values()).map((p) => p.initialize().catch(() => undefined)));
        this.initialized = true;
    }
    get(providerId) {
        const provider = this.providers.get(providerId);
        if (!provider)
            throw new Error(`Unknown AI provider: ${providerId}`);
        return provider;
    }
    list() {
        return Array.from(this.providers.values());
    }
    ids() {
        return Array.from(this.providers.keys());
    }
    async shutdownAll() {
        await Promise.all(this.list().map((p) => p.shutdown().catch(() => undefined)));
    }
}
exports.ProviderRegistry = ProviderRegistry;
//# sourceMappingURL=ProviderRegistry.js.map