"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphIndexer = void 0;
const MemoryEvents_1 = require("./MemoryEvents");
/**
 * Manages the lifecycle of the KnowledgeIndex.
 * Supports full rebuild, incremental updates, and integrity repair.
 */
class GraphIndexer {
    constructor(index, graph) {
        this.index = index;
        this.graph = graph;
    }
    async rebuild() {
        const start = Date.now();
        await this.index.rebuild();
        const stats = this.index.getStats();
        const result = {
            action: 'rebuild',
            nodesIndexed: stats.totalEntries,
            durationMs: Date.now() - start,
            stats,
        };
        await MemoryEvents_1.MemoryEvents.emit('graph:indexed', 'system', result);
        return result;
    }
    async indexNode(node) {
        this.index.upsertEntry(node);
    }
    async removeFromIndex(nodeId) {
        this.index.removeEntry(nodeId);
    }
    /**
     * Repair: reload any nodes missing from the in-memory index.
     * Useful after partial failures or warm-instance restart.
     */
    async repair() {
        const start = Date.now();
        const nodes = await this.graph.listNodes(5000);
        const indexedIds = new Set(this.index.getAllEntries().map((e) => e.nodeId));
        let repaired = 0;
        for (const node of nodes) {
            if (!indexedIds.has(node.id)) {
                this.index.upsertEntry(node);
                repaired++;
            }
        }
        const stats = this.index.getStats();
        return {
            action: 'repair',
            nodesIndexed: repaired,
            durationMs: Date.now() - start,
            stats,
        };
    }
    getStats() {
        return this.index.getStats();
    }
}
exports.GraphIndexer = GraphIndexer;
//# sourceMappingURL=GraphIndexer.js.map