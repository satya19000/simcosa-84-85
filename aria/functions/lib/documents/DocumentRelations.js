"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentRelations = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const memory_graph_1 = require("../memory-graph");
class DocumentRelations {
    constructor(db, apiKey) {
        this.db = db;
        this.apiKey = apiKey;
        this.client = new sdk_1.default({ apiKey: this.apiKey });
    }
    async linkToMemoryGraph(document, text, entities) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(document.userId, this.db, this.apiKey);
            const builder = (0, memory_graph_1.getGraphBuilder)(document.userId, this.db, this.apiKey);
            const { node: docNode } = await graph.upsertNode('document', document.title, `${document.category} document — ${document.format}`, { documentId: document.id, category: document.category, format: document.format }, 40);
            for (const entity of entities) {
                if (entity.type === 'person') {
                    const { node: personNode } = await graph.upsertNode('person', entity.value, `Person mentioned in ${document.title}`, { source: 'document', documentId: document.id }, 50);
                    await graph.upsertEdge(docNode.id, personNode.id, 'MENTIONED_IN', {
                        weight: entity.confidence,
                        confidence: entity.confidence,
                        metadata: { context: entity.context },
                    });
                }
                else if (entity.type === 'organization' || entity.type === 'hospital') {
                    const nodeType = entity.type === 'hospital' ? 'hospital' : 'organization';
                    const { node: orgNode } = await graph.upsertNode(nodeType, entity.value, `Organization mentioned in ${document.title}`, { source: 'document', documentId: document.id }, 45);
                    await graph.upsertEdge(docNode.id, orgNode.id, 'MENTIONED_IN', {
                        weight: entity.confidence,
                        confidence: entity.confidence,
                    });
                }
            }
            await builder.buildFromChat({
                messageId: `doc-${document.id}`,
                text: text.slice(0, 2000),
                role: 'assistant',
            });
        }
        catch {
            // Graph linking is best-effort
        }
    }
    async extractEntities(document, text) {
        if (text.length < 20)
            return [];
        try {
            const response = await this.client.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: `Extract named entities from this document text as a JSON array:
[
  { "type": "person|organization|hospital|medicine|disease|program|location|date|phone|email|project|task|reminder|amount|percentage|custom", "value": "string", "context": "surrounding text", "confidence": 0.0-1.0 }
]

Document: "${document.title}"
Text (first 2000 chars): ${text.slice(0, 2000)}

Return ONLY valid JSON array.`,
                    },
                ],
            });
            const textBlock = response.content.find((b) => b.type === 'text');
            const raw = textBlock?.type === 'text' ? textBlock.text : '[]';
            const match = raw.match(/\[[\s\S]*\]/);
            if (!match)
                return [];
            return JSON.parse(match[0]);
        }
        catch {
            return [];
        }
    }
}
exports.DocumentRelations = DocumentRelations;
//# sourceMappingURL=DocumentRelations.js.map