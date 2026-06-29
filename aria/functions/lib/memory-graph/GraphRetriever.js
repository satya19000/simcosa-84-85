"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphRetriever = void 0;
/**
 * High-level retrieval API consumed by agents and the Context Engine.
 * Combines search → expand → compress into a single call.
 */
class GraphRetriever {
    constructor(search, graph, expander, compressor, config) {
        this.search = search;
        this.graph = graph;
        this.expander = expander;
        this.compressor = compressor;
        this.config = config;
    }
    /** Main retrieval entry point for agents and Claude prompt assembly. */
    async retrieve(opts) {
        // 1. Search
        const results = await this.search.search({ ...opts, includeEdges: true });
        // 2. Lazy-expand top results only
        const topResults = results.slice(0, 5);
        const expanded = await this.expander.expandResults(topResults);
        // 3. Compress into token budget
        const compressedContext = await this.compressor.compress(expanded, opts.query, this.config.compressionTokenBudget);
        const tokenEstimate = Math.ceil(compressedContext.length / 4);
        return {
            results,
            compressedContext,
            tokenEstimate,
            retrievedAt: new Date().toISOString(),
        };
    }
    /** Retrieve context for a specific node by id (for agent detail fetching). */
    async retrieveNode(nodeId) {
        const node = await this.graph.getNode(nodeId);
        if (!node)
            return null;
        const edges = await this.graph.getEdgesForNode(nodeId);
        return { node, score: node.importance, matchReason: 'Direct lookup', edges };
    }
    /** Retrieve all nodes related to a seed node up to depth. */
    async retrieveNeighborhood(nodeId, depth = 2) {
        const node = await this.graph.getNode(nodeId);
        if (!node)
            return [];
        const visited = new Set([nodeId]);
        const results = [];
        let frontier = [nodeId];
        for (let d = 0; d < depth; d++) {
            const nextFrontier = [];
            for (const id of frontier) {
                const edges = await this.graph.getEdgesForNode(id);
                for (const edge of edges) {
                    const neighborId = edge.fromId === id ? edge.toId : edge.fromId;
                    if (!visited.has(neighborId)) {
                        visited.add(neighborId);
                        nextFrontier.push(neighborId);
                        const neighbor = await this.graph.getNode(neighborId);
                        if (neighbor) {
                            results.push({ node: neighbor, score: neighbor.importance * edge.weight, matchReason: `Connected via ${edge.type}`, edges: [edge] });
                        }
                    }
                }
            }
            frontier = nextFrontier;
        }
        return results.sort((a, b) => b.score - a.score);
    }
}
exports.GraphRetriever = GraphRetriever;
//# sourceMappingURL=GraphRetriever.js.map