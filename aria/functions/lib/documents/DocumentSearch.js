"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentSearch = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const DocumentChunker_1 = require("./DocumentChunker");
const DocumentIndexer_1 = require("./DocumentIndexer");
class DocumentSearch {
    constructor(db, config, apiKey) {
        this.db = db;
        this.client = new sdk_1.default({ apiKey });
        this.chunker = new DocumentChunker_1.DocumentChunker(db);
        this.indexer = new DocumentIndexer_1.DocumentIndexer(db, config);
    }
    async search(userId, opts) {
        const mode = opts.mode ?? 'hybrid';
        const limit = opts.limit ?? 20;
        switch (mode) {
            case 'keyword': return this.keywordSearch(userId, opts, limit);
            case 'semantic': return this.semanticSearch(userId, opts, limit);
            case 'metadata': return this.metadataSearch(userId, opts, limit);
            case 'hybrid': {
                const [kw, sem] = await Promise.all([
                    this.keywordSearch(userId, opts, limit),
                    this.semanticSearch(userId, opts, limit),
                ]);
                return this.merge(kw, sem, limit);
            }
        }
    }
    async keywordSearch(userId, opts, limit) {
        const entries = await this.indexer.search(userId, opts.query, limit * 2);
        const results = [];
        for (const entry of entries) {
            if (opts.category && entry.category !== opts.category)
                continue;
            if (opts.format && entry.format !== opts.format)
                continue;
            const chunks = await this.chunker.searchChunks(userId, opts.query, 3);
            const docChunks = chunks.filter((c) => c.documentId === entry.documentId);
            const best = docChunks[0];
            results.push({
                documentId: entry.documentId,
                chunkId: best?.id ?? '',
                score: 0.7,
                snippet: best?.text.slice(0, 200) ?? entry.title,
                title: entry.title,
            });
            if (results.length >= limit)
                break;
        }
        return results;
    }
    async semanticSearch(userId, opts, limit) {
        try {
            const snap = await this.db
                .collection(`users/${userId}/documents`)
                .where('status', '!=', 'deleted')
                .limit(50)
                .get();
            const docs = snap.docs.map((d) => d.data());
            if (docs.length === 0)
                return [];
            const docList = docs.map((d, i) => `${i}: ${d.title} (${d.category})`).join('\n');
            const response = await this.client.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: 256,
                messages: [
                    {
                        role: 'user',
                        content: `Given this search query: "${opts.query}"

Documents:
${docList}

Return a JSON array of the most relevant document indices (0-based), ordered by relevance, limit ${limit}:
[0, 3, 7, ...]

Return ONLY the JSON array.`,
                    },
                ],
            });
            const textBlock = response.content.find((b) => b.type === 'text');
            const raw = textBlock?.type === 'text' ? textBlock.text : '[]';
            const match = raw.match(/\[[\s\S]*\]/);
            if (!match)
                return [];
            const indices = JSON.parse(match[0]);
            const results = [];
            for (const idx of indices) {
                const doc = docs[idx];
                if (!doc)
                    continue;
                results.push({
                    documentId: doc.id,
                    chunkId: '',
                    score: 0.9 - results.length * 0.05,
                    snippet: doc.title,
                    title: doc.title,
                });
            }
            return results;
        }
        catch {
            return [];
        }
    }
    async metadataSearch(userId, opts, limit) {
        let query = this.db
            .collection(`users/${userId}/documents`)
            .where('status', '!=', 'deleted');
        if (opts.category)
            query = query.where('category', '==', opts.category);
        if (opts.format)
            query = query.where('format', '==', opts.format);
        if (opts.folderId)
            query = query.where('folderId', '==', opts.folderId);
        const snap = await query.limit(limit).get();
        return snap.docs.map((d) => {
            const rec = d.data();
            return { documentId: rec.id, chunkId: '', score: 0.5, snippet: rec.title, title: rec.title };
        });
    }
    merge(kw, sem, limit) {
        const map = new Map();
        for (const r of kw)
            map.set(r.documentId, r);
        for (const r of sem) {
            const existing = map.get(r.documentId);
            if (existing) {
                existing.score = Math.min(1, existing.score + r.score * 0.3);
            }
            else {
                map.set(r.documentId, r);
            }
        }
        return [...map.values()].sort((a, b) => b.score - a.score).slice(0, limit);
    }
}
exports.DocumentSearch = DocumentSearch;
//# sourceMappingURL=DocumentSearch.js.map