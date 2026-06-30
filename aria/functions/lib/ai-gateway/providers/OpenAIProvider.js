"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const ModelCatalog_1 = require("../ModelCatalog");
const OPENAI_API_BASE = 'https://api.openai.com/v1';
/**
 * OpenAI provider via plain REST (chat completions) — no extra SDK
 * dependency added, consistent with the lean dependency footprint of the
 * rest of aria/functions. Fully functional when OPENAI_API_KEY is set;
 * healthCheck() reports unavailable (not an error) when the key is absent
 * so ProviderRegistry/Router can route around it instead of failing loudly.
 */
class OpenAIProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.id = 'openai';
        this.catalog = new ModelCatalog_1.ModelCatalogStore();
    }
    async initialize() {
        // No persistent client needed for fetch-based REST calls.
    }
    async healthCheck() {
        if (!this.apiKey)
            return { available: false, latencyMs: 0, error: 'No API key configured' };
        const start = Date.now();
        try {
            const res = await fetch(`${OPENAI_API_BASE}/models`, {
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
        return this.catalog.byProvider('openai');
    }
    async complete(prompt, options) {
        if (!this.apiKey)
            throw new Error('OpenAI provider not configured');
        const start = Date.now();
        const messages = [
            { role: 'system', content: this.buildSystemPrompt(prompt) },
            ...prompt.history.map((h) => ({ role: h.role, content: h.content })),
            { role: 'user', content: prompt.userMessage },
        ];
        const tools = prompt.tools?.map((t) => ({
            type: 'function',
            function: { name: t.name, description: t.description, parameters: t.inputSchema },
        }));
        const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: options.model,
                max_tokens: options.maxTokens ?? prompt.maxTokens ?? 1024,
                messages,
                ...(tools && tools.length > 0 ? { tools } : {}),
            }),
        });
        if (!res.ok) {
            throw new Error(`OpenAI request failed: HTTP ${res.status}`);
        }
        const body = await res.json();
        const latencyMs = Date.now() - start;
        const choice = body.choices[0];
        const toolCalls = (choice?.message.tool_calls ?? []).map((tc) => ({
            toolName: tc.function.name,
            arguments: JSON.parse(tc.function.arguments || '{}'),
            id: tc.id,
        }));
        const inputTokens = body.usage?.prompt_tokens ?? 0;
        const outputTokens = body.usage?.completion_tokens ?? 0;
        return {
            text: choice?.message.content ?? '',
            toolCalls,
            structuredJson: null,
            usage: {
                inputTokens,
                outputTokens,
                totalTokens: inputTokens + outputTokens,
                estimatedCostUsd: this.estimateCost(options.model, inputTokens, outputTokens),
            },
            provider: 'openai',
            model: options.model,
            latencyMs,
            finishReason: choice?.finish_reason === 'tool_calls' ? 'tool_use' : choice?.finish_reason === 'length' ? 'length' : 'stop',
            safetyFlags: [],
            ...(options.debugMode ? { raw: body } : {}),
        };
    }
    async stream(prompt, options, onChunk) {
        // Streaming not implemented for OpenAI in this phase — fall back to a
        // single complete() call and emit it as one chunk, keeping the
        // interface honest rather than half-implementing SSE parsing.
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
exports.OpenAIProvider = OpenAIProvider;
//# sourceMappingURL=OpenAIProvider.js.map