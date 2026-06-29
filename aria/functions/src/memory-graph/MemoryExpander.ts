import type { GraphSearchResult } from './MemoryTypes'
import type { MemoryGraph } from './MemoryGraph'

/**
 * Lazy-loads additional detail for a set of search results.
 * Only expands top-ranked nodes to avoid over-fetching.
 */
export class MemoryExpander {
  constructor(private readonly graph: MemoryGraph) {}

  /**
   * Expand results by loading their full edge neighbourhoods.
   * Modifies results in-place (adds edges if not already present).
   */
  async expandResults(results: GraphSearchResult[]): Promise<GraphSearchResult[]> {
    return Promise.all(
      results.map(async (r) => {
        if (r.edges && r.edges.length > 0) return r // already loaded
        const edges = await this.graph.getEdgesForNode(r.node.id)
        return { ...r, edges }
      })
    )
  }

  /**
   * Expand a single node: load node + all its edges.
   * Used when an agent explicitly requests detail on a specific node.
   */
  async expandNode(nodeId: string): Promise<GraphSearchResult | null> {
    const node = await this.graph.getNode(nodeId)
    if (!node) return null
    const edges = await this.graph.getEdgesForNode(nodeId)
    return { node, score: node.importance, matchReason: 'Explicit expansion', edges }
  }
}
