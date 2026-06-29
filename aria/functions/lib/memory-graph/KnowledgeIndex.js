"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeIndex = void 0;
/**
 * Maintains an in-memory keyword index over graph nodes for fast retrieval.
 * Backed by a Firestore snapshot that is refreshed on TTL.
 */
class KnowledgeIndex {
    constructor(graph, config) {
        this.graph = graph;
        this.config = config;
        this.entries = [];
        this.nodeMap = new Map();
        this.edgeMap = new Map();
        this.lastLoadedAt = 0;
        this.stats = {
            totalEntries: 0,
            lastBuiltAt: '',
            lastIncrementalAt: '',
            rebuildCount: 0,
        };
    }
    /** Ensure index is fresh; reload from Firestore if TTL expired. */
    async ensureFresh() {
        if (Date.now() - this.lastLoadedAt > this.config.indexCacheTTLMs) {
            await this.rebuild();
        }
    }
    /** Full rebuild from Firestore. */
    async rebuild() {
        const nodes = await this.graph.listNodes(5000);
        this.entries = nodes.map(this.toEntry);
        this.nodeMap.clear();
        for (const node of nodes)
            this.nodeMap.set(node.id, node);
        this.lastLoadedAt = Date.now();
        this.stats.lastBuiltAt = new Date().toISOString();
        this.stats.totalEntries = this.entries.length;
        this.stats.rebuildCount++;
    }
    /** Incremental: add/update a single node without full rebuild. */
    upsertEntry(node) {
        const idx = this.entries.findIndex((e) => e.nodeId === node.id);
        const entry = this.toEntry(node);
        if (idx >= 0)
            this.entries[idx] = entry;
        else
            this.entries.push(entry);
        this.nodeMap.set(node.id, node);
        this.stats.totalEntries = this.entries.length;
        this.stats.lastIncrementalAt = new Date().toISOString();
    }
    removeEntry(nodeId) {
        this.entries = this.entries.filter((e) => e.nodeId !== nodeId);
        this.nodeMap.delete(nodeId);
        this.edgeMap.delete(nodeId);
        this.stats.totalEntries = this.entries.length;
    }
    /** Keyword search across title + keywords. */
    keywordSearch(query, limit, nodeTypes) {
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        const scored = this.entries
            .filter((e) => !nodeTypes || nodeTypes.includes(e.type))
            .map((entry) => {
            let score = 0;
            for (const term of terms) {
                if (entry.titleLower.includes(term))
                    score += 10;
                if (entry.keywords.some((k) => k.includes(term)))
                    score += 5;
            }
            score += entry.importance * 0.3;
            return { entry, score };
        })
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        return scored.map((x) => x.entry);
    }
    getNode(nodeId) {
        return this.nodeMap.get(nodeId);
    }
    getAllEntries() {
        return [...this.entries];
    }
    getStats() {
        return { ...this.stats };
    }
    /** Extract meaningful keywords from node title and summary. */
    toEntry(node) {
        const words = `${node.title} ${node.summary}`
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((w) => w.length > 2);
        const keywords = [...new Set(words)];
        return {
            nodeId: node.id,
            title: node.title,
            titleLower: node.title.toLowerCase(),
            type: node.type,
            importance: node.importance,
            keywords,
            updatedAt: node.updatedAt,
        };
    }
}
exports.KnowledgeIndex = KnowledgeIndex;
//# sourceMappingURL=KnowledgeIndex.js.map