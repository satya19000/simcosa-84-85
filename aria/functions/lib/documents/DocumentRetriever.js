"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentRetriever = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const DocumentChunker_1 = require("./DocumentChunker");
const DocumentSearch_1 = require("./DocumentSearch");
class DocumentRetriever {
    constructor(db, config, apiKey) {
        this.client = new sdk_1.default({ apiKey });
        this.chunker = new DocumentChunker_1.DocumentChunker(db);
        this.search = new DocumentSearch_1.DocumentSearch(db, config, apiKey);
    }
    async retrieve(userId, query, limit = 10) {
        const results = await this.search.search(userId, { query, mode: 'hybrid', limit });
        const chunks = [];
        const seen = new Set();
        for (const r of results) {
            if (seen.has(r.chunkId))
                continue;
            seen.add(r.chunkId);
            const docChunks = await this.chunker.getChunks(userId, r.documentId);
            const chunk = docChunks.find((c) => c.id === r.chunkId);
            if (chunk)
                chunks.push(chunk);
        }
        return chunks.slice(0, limit);
    }
    async chat(userId, documentId, question) {
        const chunks = await this.chunker.getChunks(userId, documentId);
        if (chunks.length === 0)
            return 'Document has no indexed content.';
        const context = chunks.map((c, i) => `[${i + 1}] ${c.text}`).join('\n\n').slice(0, 8000);
        try {
            const response = await this.client.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: `Answer the question based on the document content below.

Document content:
${context}

Question: ${question}

Answer concisely and accurately based only on the document content.`,
                    },
                ],
            });
            const textBlock = response.content.find((b) => b.type === 'text');
            return textBlock?.type === 'text' ? textBlock.text : 'Unable to answer.';
        }
        catch {
            return 'Unable to answer at this time.';
        }
    }
    async contextForQuery(userId, query, tokenBudget = 2000) {
        const chunks = await this.retrieve(userId, query, 15);
        let context = '';
        for (const chunk of chunks) {
            const addition = `\n\n[Document chunk]\n${chunk.text}`;
            if ((context + addition).length / 4 > tokenBudget)
                break;
            context += addition;
        }
        return context.trim();
    }
}
exports.DocumentRetriever = DocumentRetriever;
//# sourceMappingURL=DocumentRetriever.js.map