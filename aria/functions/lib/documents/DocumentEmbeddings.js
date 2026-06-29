"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentEmbeddings = void 0;
exports.registerEmbeddingProvider = registerEmbeddingProvider;
exports.getEmbeddingProvider = getEmbeddingProvider;
const uuid_1 = require("uuid");
const COL = (userId) => `users/${userId}/documentEmbeddings`;
// ── No-op provider (default until a vector DB is configured) ──────────────────
class NoOpEmbeddingProvider {
    constructor() {
        this.name = 'noop';
        this.dimensions = 0;
    }
    async embed(_texts) { return []; }
    async embedOne(_text) { return []; }
}
// ── Registry ──────────────────────────────────────────────────────────────────
const providers = new Map();
providers.set('noop', new NoOpEmbeddingProvider());
function registerEmbeddingProvider(provider) {
    providers.set(provider.name, provider);
}
function getEmbeddingProvider(name) {
    return providers.get(name) ?? providers.get('noop');
}
// ── Storage ───────────────────────────────────────────────────────────────────
class DocumentEmbeddings {
    constructor(db, providerName) {
        this.db = db;
        this.providerName = providerName;
    }
    async embedChunks(chunks) {
        const provider = getEmbeddingProvider(this.providerName);
        if (provider.dimensions === 0 || chunks.length === 0)
            return [];
        const texts = chunks.map((c) => c.text);
        const vectors = await provider.embed(texts);
        const results = [];
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const vector = vectors[i];
            if (!vector || vector.length === 0)
                continue;
            const record = {
                id: (0, uuid_1.v4)(),
                documentId: chunk.documentId,
                chunkId: chunk.id,
                userId: chunk.userId,
                provider: this.providerName,
                dimensions: provider.dimensions,
                vector,
                createdAt: new Date().toISOString(),
            };
            await this.db.collection(COL(chunk.userId)).doc(record.id).set(record);
            results.push(record);
        }
        return results;
    }
    /** Cosine similarity search (client-side — use Vertex AI / Pinecone for production). */
    async similaritySearch(userId, queryVector, limit = 10) {
        const snap = await this.db.collection(COL(userId)).limit(500).get();
        const results = snap.docs
            .map((d) => {
            const rec = d.data();
            return { embeddingId: rec.id, chunkId: rec.chunkId, documentId: rec.documentId, score: cosine(queryVector, rec.vector) };
        })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        return results;
    }
}
exports.DocumentEmbeddings = DocumentEmbeddings;
function cosine(a, b) {
    if (a.length !== b.length || a.length === 0)
        return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
}
//# sourceMappingURL=DocumentEmbeddings.js.map