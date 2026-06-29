import type { GraphSearchOptions, GraphSearchResult } from './MemoryTypes'
import type { GraphSearch } from './GraphSearch'
import type { MemoryGraph } from './MemoryGraph'
import type { MemoryExpander } from './MemoryExpander'
import type { MemoryCompressor } from './MemoryCompressor'
import type { MemoryConfig } from './MemoryConfig'

export interface RetrievalResult {
  results: GraphSearchResult[]
  compressedContext: string
  tokenEstimate: number
  retrievedAt: string
}

/**
 * High-level retrieval API consumed by agents and the Context Engine.
 * Combines search → expand → compress into a single call.
 */
export class GraphRetriever {
  constructor(
    private readonly search: GraphSearch,
    private readonly graph: MemoryGraph,
    private readonly expander: MemoryExpander,
    private readonly compressor: MemoryCompressor,
    private readonly config: MemoryConfig
  ) {}

  /** Main retrieval entry point for agents and Claude prompt assembly. */
  async retrieve(opts: GraphSearchOptions): Promise<RetrievalResult> {
    // 1. Search
    const results = await this.search.search({ ...opts, includeEdges: true })

    // 2. Lazy-expand top results only
    const topResults = results.slice(0, 5)
    const expanded = await this.expander.expandResults(topResults)

    // 3. Compress into token budget
    const compressedContext = await this.compressor.compress(
      expanded,
      opts.query,
      this.config.compressionTokenBudget
    )

    const tokenEstimate = Math.ceil(compressedContext.length / 4)

    return {
      results,
      compressedContext,
      tokenEstimate,
      retrievedAt: new Date().toISOString(),
    }
  }

  /** Retrieve context for a specific node by id (for agent detail fetching). */
  async retrieveNode(nodeId: string): Promise<GraphSearchResult | null> {
    const node = await this.graph.getNode(nodeId)
    if (!node) return null
    const edges = await this.graph.getEdgesForNode(nodeId)
    return { node, score: node.importance, matchReason: 'Direct lookup', edges }
  }

  /** Retrieve all nodes related to a seed node up to depth. */
  async retrieveNeighborhood(nodeId: string, depth = 2): Promise<GraphSearchResult[]> {
    const node = await this.graph.getNode(nodeId)
    if (!node) return []

    const visited = new Set<string>([nodeId])
    const results: GraphSearchResult[] = []
    let frontier = [nodeId]

    for (let d = 0; d < depth; d++) {
      const nextFrontier: string[] = []
      for (const id of frontier) {
        const edges = await this.graph.getEdgesForNode(id)
        for (const edge of edges) {
          const neighborId = edge.fromId === id ? edge.toId : edge.fromId
          if (!visited.has(neighborId)) {
            visited.add(neighborId)
            nextFrontier.push(neighborId)
            const neighbor = await this.graph.getNode(neighborId)
            if (neighbor) {
              results.push({ node: neighbor, score: neighbor.importance * edge.weight, matchReason: `Connected via ${edge.type}`, edges: [edge] })
            }
          }
        }
      }
      frontier = nextFrontier
    }

    return results.sort((a, b) => b.score - a.score)
  }
}
