"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCompressor = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
/**
 * Reduces a set of graph search results into a compact text context
 * suitable for inclusion in Claude prompts.
 */
class MemoryCompressor {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    /**
     * Compress results into a text block within the token budget.
     * Uses AI summarization when results exceed the budget.
     */
    async compress(results, query, tokenBudget) {
        if (results.length === 0)
            return '';
        const raw = this.formatRaw(results);
        const estimatedTokens = Math.ceil(raw.length / 4);
        if (estimatedTokens <= tokenBudget) {
            return raw;
        }
        // Over budget — use Claude to summarize
        return this.aiCompress(raw, query, tokenBudget);
    }
    formatRaw(results) {
        const lines = ['## Relevant Memory Context', ''];
        for (const r of results) {
            const { node, edges } = r;
            lines.push(`### ${node.title} (${node.type}, importance: ${node.importance})`);
            if (node.summary)
                lines.push(node.summary);
            if (edges && edges.length > 0) {
                const edgeLines = this.formatEdges(node.id, edges, results);
                if (edgeLines.length > 0) {
                    lines.push('Relationships:');
                    lines.push(...edgeLines);
                }
            }
            lines.push('');
        }
        return lines.join('\n');
    }
    formatEdges(nodeId, edges, results) {
        const nodeIndex = new Map(results.map((r) => [r.node.id, r.node.title]));
        return edges
            .filter((e) => e.fromId === nodeId)
            .map((e) => {
            const targetTitle = nodeIndex.get(e.toId) ?? e.toId.slice(0, 8) + '…';
            return `  → ${e.type} → ${targetTitle} (weight: ${e.weight.toFixed(2)})`;
        });
    }
    async aiCompress(raw, query, tokenBudget) {
        try {
            const client = new sdk_1.default({ apiKey: this.apiKey });
            const charBudget = tokenBudget * 4;
            const response = await client.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: Math.min(1024, tokenBudget),
                messages: [
                    {
                        role: 'user',
                        content: `Compress the following memory context to be relevant to the query: "${query}"
Keep it under ${charBudget} characters. Preserve names, relationships, and key facts. Remove low-relevance details.

${raw}

Return ONLY the compressed context, no explanation.`,
                    },
                ],
            });
            const textBlock = response.content.find((b) => b.type === 'text');
            return textBlock?.type === 'text' ? textBlock.text : raw.slice(0, charBudget);
        }
        catch {
            // Truncate if AI fails
            return raw.slice(0, tokenBudget * 4);
        }
    }
}
exports.MemoryCompressor = MemoryCompressor;
//# sourceMappingURL=MemoryCompressor.js.map