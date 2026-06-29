"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryAnalytics = void 0;
/**
 * Computes graph statistics and usage analytics.
 */
class MemoryAnalytics {
    constructor(graph, config) {
        this.graph = graph;
        this.config = config;
        this.providers = [];
    }
    registerProvider(provider) {
        this.providers.push(provider);
    }
    async computeStats() {
        const nodes = await this.graph.listNodes(5000);
        const [nodeCount, edgeCount] = await Promise.all([this.graph.countNodes(), this.graph.countEdges()]);
        // Node type distribution
        const nodesByType = {};
        for (const node of nodes) {
            nodesByType[node.type] = (nodesByType[node.type] ?? 0) + 1;
        }
        // Edge type distribution + degree counting
        const edgesByType = {};
        const degreeMap = new Map();
        let totalEdges = 0;
        for (const node of nodes) {
            const edges = await this.graph.getEdgesFrom(node.id);
            for (const edge of edges) {
                edgesByType[edge.type] = (edgesByType[edge.type] ?? 0) + 1;
                degreeMap.set(edge.fromId, (degreeMap.get(edge.fromId) ?? 0) + 1);
                degreeMap.set(edge.toId, (degreeMap.get(edge.toId) ?? 0) + 1);
                totalEdges++;
            }
        }
        const avgEdgesPerNode = nodes.length > 0 ? totalEdges / nodes.length : 0;
        const orphanNodes = nodes.filter((n) => !degreeMap.has(n.id)).length;
        // Top connected nodes
        const nodeById = new Map(nodes.map((n) => [n.id, n]));
        const mostConnectedNodes = [...degreeMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([id, degree]) => ({
            id,
            title: nodeById.get(id)?.title ?? '(unknown)',
            degree,
        }));
        return {
            nodeCount,
            edgeCount,
            nodesByType,
            edgesByType,
            avgEdgesPerNode: Math.round(avgEdgesPerNode * 100) / 100,
            orphanNodes,
            mostConnectedNodes,
            compressionRatio: 1, // updated by MemoryCompressor in real use
            lastIndexedAt: new Date().toISOString(),
        };
    }
    async computeTopContacts(limit = 10) {
        const nodes = await this.graph.queryNodesByType('person', limit * 3);
        const withEdges = await Promise.all(nodes.map(async (n) => ({
            nodeId: n.id,
            title: n.title,
            mentions: (await this.graph.getEdgesForNode(n.id)).length,
        })));
        return withEdges.sort((a, b) => b.mentions - a.mentions).slice(0, limit);
    }
    async computeActiveProjects(limit = 10) {
        const projects = await this.graph.queryNodesByType('project', limit * 3);
        const result = await Promise.all(projects.map(async (p) => {
            const edges = await this.graph.getEdgesTo(p.id);
            const taskEdges = edges.filter((e) => e.type === 'PART_OF');
            return { nodeId: p.id, title: p.title, taskCount: taskEdges.length };
        }));
        return result.sort((a, b) => b.taskCount - a.taskCount).slice(0, limit);
    }
    async runProviders() {
        if (!this.config.analyticsEnabled || this.providers.length === 0)
            return {};
        const nodes = await this.graph.listNodes(1000);
        const allEdges = [];
        for (const node of nodes.slice(0, 100)) {
            const edges = await this.graph.getEdgesFrom(node.id);
            allEdges.push(...edges);
        }
        const results = {};
        for (const provider of this.providers) {
            results[provider.name] = await provider.compute(nodes, allEdges);
        }
        return results;
    }
}
exports.MemoryAnalytics = MemoryAnalytics;
//# sourceMappingURL=MemoryAnalytics.js.map