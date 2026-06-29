"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphSearch = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
/**
 * Unified search pipeline supporting keyword, semantic, relationship, and hybrid modes.
 */
class GraphSearch {
    constructor(graph, index, scorer, relationshipEngine, config, apiKey) {
        this.graph = graph;
        this.index = index;
        this.scorer = scorer;
        this.relationshipEngine = relationshipEngine;
        this.config = config;
        this.apiKey = apiKey;
    }
    async search(opts) {
        await this.index.ensureFresh();
        switch (opts.mode) {
            case 'keyword':
                return this.keywordSearch(opts);
            case 'semantic':
                return this.semanticSearch(opts);
            case 'relationship':
                return this.relationshipSearch(opts);
            case 'hybrid':
            default:
                return this.hybridSearch(opts);
        }
    }
    async keywordSearch(opts) {
        const limit = opts.maxNodes ?? this.config.maxSearchResults;
        const entries = this.index.keywordSearch(opts.query, limit * 2, opts.nodeTypes);
        const results = [];
        for (const entry of entries) {
            const node = this.index.getNode(entry.nodeId);
            if (!node)
                continue;
            if (opts.minImportance && node.importance < opts.minImportance)
                continue;
            const edges = opts.includeEdges ? await this.graph.getEdgesForNode(node.id) : [];
            const terms = opts.query.toLowerCase().split(/\s+/);
            const scored = this.scorer.score(node, edges, terms);
            results.push({
                node,
                score: scored.score,
                matchReason: `Keyword match in title or summary`,
                edges: opts.includeEdges ? edges : undefined,
            });
        }
        return results.sort((a, b) => b.score - a.score).slice(0, limit);
    }
    async semanticSearch(opts) {
        // Use Claude to identify relevant nodes from the query
        try {
            const client = new sdk_1.default({ apiKey: this.apiKey });
            const allEntries = this.index.getAllEntries();
            if (allEntries.length === 0)
                return [];
            const nodeList = allEntries
                .slice(0, 200)
                .map((e) => `[${e.nodeId}] (${e.type}) ${e.title}`)
                .join('\n');
            const response = await client.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: 512,
                messages: [
                    {
                        role: 'user',
                        content: `Given this query: "${opts.query}"

Find the most semantically relevant node IDs from this list (return at most ${opts.maxNodes ?? 10} IDs as a JSON array):
${nodeList}

Return ONLY a JSON array of node IDs like: ["id1","id2"]. No explanation.`,
                    },
                ],
            });
            const textBlock = response.content.find((b) => b.type === 'text');
            const raw = textBlock?.type === 'text' ? textBlock.text.trim() : '[]';
            const match = raw.match(/\[[\s\S]*?\]/);
            const ids = match ? JSON.parse(match[0]) : [];
            const results = [];
            for (const id of ids) {
                const node = this.index.getNode(id);
                if (!node)
                    continue;
                const edges = opts.includeEdges ? await this.graph.getEdgesForNode(node.id) : [];
                const scored = this.scorer.score(node, edges, []);
                results.push({ node, score: scored.score, matchReason: 'Semantic match', edges: opts.includeEdges ? edges : undefined });
            }
            return results;
        }
        catch {
            // Fall back to keyword if Claude fails
            return this.keywordSearch(opts);
        }
    }
    async relationshipSearch(opts) {
        // Find seed nodes by keyword, then traverse their relationships
        const seeds = await this.keywordSearch({ ...opts, mode: 'keyword', maxNodes: 3 });
        if (seeds.length === 0)
            return [];
        const depth = opts.maxDepth ?? this.config.defaultTraversalDepth;
        const nodeSet = new Map();
        const edgeSet = new Map();
        for (const seed of seeds) {
            nodeSet.set(seed.node.id, seed.node);
            const { nodes, edges } = await this.relationshipEngine.traverse(seed.node.id, depth);
            for (const n of nodes)
                nodeSet.set(n.id, n);
            for (const e of edges)
                edgeSet.set(e.id, e);
        }
        const results = [];
        for (const node of nodeSet.values()) {
            const nodeEdges = [...edgeSet.values()].filter((e) => e.fromId === node.id || e.toId === node.id);
            const scored = this.scorer.score(node, nodeEdges, opts.query.toLowerCase().split(/\s+/));
            results.push({
                node,
                score: scored.score,
                matchReason: seeds.some((s) => s.node.id === node.id) ? 'Seed node' : 'Relationship traversal',
                edges: opts.includeEdges ? nodeEdges : undefined,
            });
        }
        return results.sort((a, b) => b.score - a.score).slice(0, opts.maxNodes ?? this.config.maxSearchResults);
    }
    async hybridSearch(opts) {
        const [keyword, relationship] = await Promise.all([
            this.keywordSearch({ ...opts, mode: 'keyword', maxNodes: 10 }),
            this.relationshipSearch({ ...opts, mode: 'relationship', maxNodes: 10 }),
        ]);
        // Merge and deduplicate, boosting nodes that appear in both
        const merged = new Map();
        for (const r of keyword)
            merged.set(r.node.id, r);
        for (const r of relationship) {
            const existing = merged.get(r.node.id);
            if (existing) {
                merged.set(r.node.id, { ...existing, score: Math.min(100, existing.score + r.score * 0.3), matchReason: 'Hybrid match' });
            }
            else {
                merged.set(r.node.id, r);
            }
        }
        return [...merged.values()]
            .sort((a, b) => b.score - a.score)
            .slice(0, opts.maxNodes ?? this.config.maxSearchResults);
    }
}
exports.GraphSearch = GraphSearch;
//# sourceMappingURL=GraphSearch.js.map