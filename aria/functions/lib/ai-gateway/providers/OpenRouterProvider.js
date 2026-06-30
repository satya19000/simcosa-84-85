"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenRouterProvider = void 0;
const ModelCatalog_1 = require("../ModelCatalog");
const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
/**
 * OpenRouter provider — exposes an OpenAI-compatible chat completions API
 * that proxies many upstream model vendors. Used here primarily as a
 * fallback/aggregator option rather than a primary route.
 */
class OpenRouterProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.id = 'openrouter';
        this.catalog = new ModelCatalog_1.ModelCatalogStore();
    }
    async initialize() { }
    async healthCheck() {
        if (!this.apiKey)
            return { available: false, latencyMs: 0, error: 'No API key configured' };
        const start = Date.now();
        try {
            const res = await fetch(`${OPENROUTER_API_BASE}/models`, {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            });
            if (!res.ok)
                return { available: false, latencyMs: Date.now() - start, error: `HTTP ${res.status}` };
            return { available: true, latencyMs: Date.now() - start };
        }
        catch (err) {
            return { available: false, latencyMs: Date.now() - start, error: err instanceof Error ? err.message : 'Unknown error' };
        }
    }
    listModels() {
        return this.catalog.byProvider('openrouter');
    }
    async complete(prompt, options) {
        if (!this.apiKey)
            throw new Error('OpenRouter provider not configured');
        const start = Date.now();
        const messages = [
            { role: 'system', content: this.buildSystemPrompt(prompt) },
            ...prompt.history.map((h) => ({ role: h.role, content: h.content })),
            { role: 'user', content: prompt.userMessage },
        ];
        const res = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: options.model,
                max_tokens: options.maxTokens ?? prompt.maxTokens ?? 1024,
                messages,
            }),
        });
        if (!res.ok) {
            throw new Error(`OpenRouter request failed: HTTP ${res.status}`);
        }
        const body = await res.json();
        const latencyMs = Date.now() - start;
        const choice = body.choices[0];
        const inputTokens = body.usage?.prompt_tokens ?? 0;
        const outputTokens = body.usage?.completion_tokens ?? 0;
        return {
            text: choice?.message.content ?? '',
            toolCalls: [],
            structuredJson: null,
            usage: {
                inputTokens,
                outputTokens,
                totalTokens: inputTokens + outputTokens,
                estimatedCostUsd: this.estimateCost(options.model, inputTokens, outputTokens),
            },
            provider: 'openrouter',
            model: options.model,
            latencyMs,
            finishReason: choice?.finish_reason === 'length' ? 'length' : 'stop',
            safetyFlags: [],
            ...(options.debugMode ? { raw: body } : {}),
        };
    }
    async stream(prompt, options, onChunk) {
        const result = await this.complete(prompt, options);
        onChunk({ delta: result.text, done: true });
        return result;
    }
    estimateCost(model, inputTokens, outputTokens) {
        const descriptor = this.catalog.byModelId(model);
        if (!descriptor)
            return 0;
        return (inputTokens / 1000) * descriptor.costPerKInputTokens + (outputTokens / 1000) * descriptor.costPerKOutputTokens;
    }
    async shutdown() { }
    buildSystemPrompt(prompt) {
        const sections = (prompt.contextSections ?? []).map((s) => `## ${s.title}\n${s.content}`);
        const memory = (prompt.memoryBlocks ?? []).map((m) => `## Memory: ${m.label}\n${m.content}`);
        return [prompt.systemPrompt, ...sections, ...memory].filter(Boolean).join('\n\n');
    }
}
exports.OpenRouterProvider = OpenRouterProvider;
//# sourceMappingURL=OpenRouterProvider.js.map