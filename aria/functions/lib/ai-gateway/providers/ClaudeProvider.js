"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeProvider = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const ModelCatalog_1 = require("../ModelCatalog");
/**
 * Real Claude provider backed by the Anthropic SDK — this is the same SDK
 * and credential chat.ts already uses for chatWithAria. This class does NOT
 * change chat.ts's direct usage; it is an independent, parallel client for
 * AIGateway-routed requests only.
 */
class ClaudeProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.id = 'claude';
        this.client = null;
        this.catalog = new ModelCatalog_1.ModelCatalogStore();
    }
    async initialize() {
        this.client = new sdk_1.default({ apiKey: this.apiKey });
    }
    async healthCheck() {
        if (!this.apiKey)
            return { available: false, latencyMs: 0, error: 'No API key configured' };
        const start = Date.now();
        try {
            if (!this.client)
                await this.initialize();
            // Cheap, low-token call used purely as a liveness probe.
            await this.client.messages.create({
                model: 'claude-haiku-4',
                max_tokens: 1,
                messages: [{ role: 'user', content: 'ping' }],
            });
            return { available: true, latencyMs: Date.now() - start };
        }
        catch (err) {
            return { available: false, latencyMs: Date.now() - start, error: err instanceof Error ? err.message : 'Unknown error' };
        }
    }
    listModels() {
        return this.catalog.byProvider('claude');
    }
    async complete(prompt, options) {
        if (!this.client)
            await this.initialize();
        const start = Date.now();
        const messages = [
            ...prompt.history.map((h) => ({ role: h.role, content: h.content })),
            { role: 'user', content: prompt.userMessage },
        ];
        const tools = prompt.tools?.map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: t.inputSchema,
        }));
        const response = await this.client.messages.create({
            model: options.model,
            max_tokens: options.maxTokens ?? prompt.maxTokens ?? 1024,
            system: this.buildSystemPrompt(prompt),
            ...(tools && tools.length > 0 ? { tools } : {}),
            messages,
        });
        const latencyMs = Date.now() - start;
        const text = response.content
            .filter((b) => b.type === 'text')
            .map((b) => b.text)
            .join('');
        const toolCalls = response.content
            .filter((b) => b.type === 'tool_use')
            .map((b) => ({ toolName: b.name, arguments: b.input, id: b.id }));
        const finishReason = response.stop_reason === 'tool_use' ? 'tool_use'
            : response.stop_reason === 'max_tokens' ? 'length'
                : 'stop';
        const inputTokens = response.usage?.input_tokens ?? 0;
        const outputTokens = response.usage?.output_tokens ?? 0;
        return {
            text,
            toolCalls,
            structuredJson: null,
            usage: {
                inputTokens,
                outputTokens,
                totalTokens: inputTokens + outputTokens,
                estimatedCostUsd: this.estimateCost(options.model, inputTokens, outputTokens),
            },
            provider: 'claude',
            model: options.model,
            latencyMs,
            finishReason,
            safetyFlags: [],
            ...(options.debugMode ? { raw: response } : {}),
        };
    }
    async stream(prompt, options, onChunk) {
        if (!this.client)
            await this.initialize();
        const start = Date.now();
        const messages = [
            ...prompt.history.map((h) => ({ role: h.role, content: h.content })),
            { role: 'user', content: prompt.userMessage },
        ];
        let text = '';
        const stream = this.client.messages.stream({
            model: options.model,
            max_tokens: options.maxTokens ?? prompt.maxTokens ?? 1024,
            system: this.buildSystemPrompt(prompt),
            messages,
        });
        stream.on('text', (delta) => {
            text += delta;
            onChunk({ delta, done: false });
        });
        const finalMessage = await stream.finalMessage();
        onChunk({ delta: '', done: true });
        const inputTokens = finalMessage.usage?.input_tokens ?? 0;
        const outputTokens = finalMessage.usage?.output_tokens ?? 0;
        const latencyMs = Date.now() - start;
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
            provider: 'claude',
            model: options.model,
            latencyMs,
            finishReason: 'stop',
            safetyFlags: [],
        };
    }
    estimateCost(model, inputTokens, outputTokens) {
        const descriptor = this.catalog.byModelId(model);
        if (!descriptor)
            return 0;
        return (inputTokens / 1000) * descriptor.costPerKInputTokens + (outputTokens / 1000) * descriptor.costPerKOutputTokens;
    }
    async shutdown() {
        this.client = null;
    }
    buildSystemPrompt(prompt) {
        const sections = (prompt.contextSections ?? []).map((s) => `## ${s.title}\n${s.content}`);
        const memory = (prompt.memoryBlocks ?? []).map((m) => `## Memory: ${m.label}\n${m.content}`);
        return [prompt.systemPrompt, ...sections, ...memory].filter(Boolean).join('\n\n');
    }
}
exports.ClaudeProvider = ClaudeProvider;
//# sourceMappingURL=ClaudeProvider.js.map