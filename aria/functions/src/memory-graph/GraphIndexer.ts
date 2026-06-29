import type { GraphNode } from './MemoryTypes'
import type { KnowledgeIndex, IndexStats } from './KnowledgeIndex'
import type { MemoryGraph } from './MemoryGraph'
import { MemoryEvents } from './MemoryEvents'

export interface IndexerResult {
  action: 'rebuild' | 'incremental' | 'repair'
  nodesIndexed: number
  durationMs: number
  stats: IndexStats
}

/**
 * Manages the lifecycle of the KnowledgeIndex.
 * Supports full rebuild, incremental updates, and integrity repair.
 */
export class GraphIndexer {
  constructor(
    private readonly index: KnowledgeIndex,
    private readonly graph: MemoryGraph
  ) {}

  async rebuild(): Promise<IndexerResult> {
    const start = Date.now()
    await this.index.rebuild()
    const stats = this.index.getStats()
    const result: IndexerResult = {
      action: 'rebuild',
      nodesIndexed: stats.totalEntries,
      durationMs: Date.now() - start,
      stats,
    }
    await MemoryEvents.emit('graph:indexed', 'system', result)
    return result
  }

  async indexNode(node: GraphNode): Promise<void> {
    this.index.upsertEntry(node)
  }

  async removeFromIndex(nodeId: string): Promise<void> {
    this.index.removeEntry(nodeId)
  }

  /**
   * Repair: reload any nodes missing from the in-memory index.
   * Useful after partial failures or warm-instance restart.
   */
  async repair(): Promise<IndexerResult> {
    const start = Date.now()
    const nodes = await this.graph.listNodes(5000)
    const indexedIds = new Set(this.index.getAllEntries().map((e) => e.nodeId))

    let repaired = 0
    for (const node of nodes) {
      if (!indexedIds.has(node.id)) {
        this.index.upsertEntry(node)
        repaired++
      }
    }

    const stats = this.index.getStats()
    return {
      action: 'repair',
      nodesIndexed: repaired,
      durationMs: Date.now() - start,
      stats,
    }
  }

  getStats(): IndexStats {
    return this.index.getStats()
  }
}
