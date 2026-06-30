"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const ModelCatalog_1 = require("../ModelCatalog");
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
/**
 * Gemini provider via plain REST (generateContent). Mirrors OpenAIProvider's
 * shape: fully functional with a key, gracefully unavailable without one.
 */
class GeminiProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.id = 'gemini';
        this.catalog = new ModelCatalog_1.ModelCatalogStore();
    }
    async initialize() { }
    async healthCheck() {
        if (!this.apiKey)
            return { available: false, latencyMs: 0, error: 'No API key configured' };
        const start = Date.now();
        try {
            const res = await fetch(`${GEMINI_API_BASE}/models?key=${this.apiKey}`);
            if (!res.ok)
                return { available: false, latencyMs: Date.now() - start, error: `HTTP ${res.status}` };
            return { available: true, latencyMs: Date.now() - start };
        }
        catch (err) {
            return { available: false, latencyMs: Date.now() - start, error: err instanceof Error ? err.message : 'Unknown error' };
        }
    }
    listModels() {
        return this.catalog.byProvider('gemini');
    }
    async complete(prompt, options) {
        if (!this.apiKey)
            throw new Error('Gemini provider not configured');
        const start = Date.now();
        const contents = [
            ...prompt.history.map((h) => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
            { role: 'user', parts: [{ text: prompt.userMessage }] },
        ];
        const res = await fetch(`${GEMINI_API_BASE}/models/${options.model}:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: this.buildSystemPrompt(prompt) }] },
                contents,
                generationConfig: { maxOutputTokens: options.maxTokens ?? prompt.maxTokens ?? 1024 },
            }),
        });
        if (!res.ok) {
            throw new Error(`Gemini request failed: HTTP ${res.status}`);
        }
        const body = await res.json();
        const latencyMs = Date.now() - start;
        const text = body.candidates?.[0]?.content.parts.map((p) => p.text ?? '').join('') ?? '';
        const inputTokens = body.usageMetadata?.promptTokenCount ?? 0;
        const outputTokens = body.usageMetadata?.candidatesTokenCount ?? 0;
        return {
            text,
            toolCalls: [],
            structuredJson: null,
            usage: {
                inputTokens,
                outputTokens,
                totalTokens: inputTokens + outputTokens,
                estimatedCostUsd: this.estimateCost(options.model, inputTokens, outputTokens),
            },
            provider: 'gemini',
            model: options.model,
            latencyMs,
            finishReason: body.candidates?.[0]?.finishReason === 'MAX_TOKENS' ? 'length' : 'stop',
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
exports.GeminiProvider = GeminiProvider;
//# sourceMappingURL=GeminiProvider.js.map