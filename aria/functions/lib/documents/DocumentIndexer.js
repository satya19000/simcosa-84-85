"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentIndexer = void 0;
const caches = new Map();
class DocumentIndexer {
    constructor(db, config) {
        this.db = db;
        this.config = config;
    }
    async search(userId, query, limit = 20) {
        const index = await this.getOrBuild(userId);
        const lower = query.toLowerCase();
        const terms = lower.split(/\s+/).filter(Boolean);
        const scored = [];
        for (const entry of index.entries) {
            const haystack = [entry.title, ...entry.keywords, ...entry.tags, entry.category].join(' ').toLowerCase();
            const score = terms.filter((t) => haystack.includes(t)).length;
            if (score > 0)
                scored.push({ entry, score });
        }
        return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.entry);
    }
    async rebuild(userId) {
        const snap = await this.db
            .collection(`users/${userId}/documents`)
            .where('status', '!=', 'deleted')
            .get();
        const entries = snap.docs.map((d) => {
            const rec = d.data();
            return {
                documentId: rec.id,
                userId: rec.userId,
                title: rec.title,
                keywords: rec.tags ?? [],
                category: rec.category,
                format: rec.format,
                tags: rec.tags ?? [],
                updatedAt: rec.updatedAt,
            };
        });
        caches.set(userId, { entries, builtAt: Date.now() });
    }
    async addEntry(userId, record) {
        const cache = caches.get(userId);
        if (!cache)
            return;
        const entry = {
            documentId: record.id,
            userId: record.userId,
            title: record.title,
            keywords: record.tags ?? [],
            category: record.category,
            format: record.format,
            tags: record.tags ?? [],
            updatedAt: record.updatedAt,
        };
        cache.entries.push(entry);
    }
    async removeEntry(userId, documentId) {
        const cache = caches.get(userId);
        if (!cache)
            return;
        cache.entries = cache.entries.filter((e) => e.documentId !== documentId);
    }
    clearCache(userId) {
        caches.delete(userId);
    }
    async getOrBuild(userId) {
        const existing = caches.get(userId);
        if (existing && Date.now() - existing.builtAt < this.config.indexCacheTTLMs)
            return existing;
        await this.rebuild(userId);
        return caches.get(userId);
    }
}
exports.DocumentIndexer = DocumentIndexer;
//# sourceMappingURL=DocumentIndexer.js.map