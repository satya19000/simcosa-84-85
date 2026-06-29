import Anthropic from '@anthropic-ai/sdk'
import type { GraphSearchOptions, GraphSearchResult, GraphNode } from './MemoryTypes'
import type { MemoryGraph } from './MemoryGraph'
import type { KnowledgeIndex } from './KnowledgeIndex'
import type { MemoryScorer } from './MemoryScorer'
import type { RelationshipEngine } from './RelationshipEngine'
import type { MemoryConfig } from './MemoryConfig'

/**
 * Unified search pipeline supporting keyword, semantic, relationship, and hybrid modes.
 */
export class GraphSearch {
  constructor(
    private readonly graph: MemoryGraph,
    private readonly index: KnowledgeIndex,
    private readonly scorer: MemoryScorer,
    private readonly relationshipEngine: RelationshipEngine,
    private readonly config: MemoryConfig,
    private readonly apiKey: string
  ) {}

  async search(opts: GraphSearchOptions): Promise<GraphSearchResult[]> {
    await this.index.ensureFresh()

    switch (opts.mode) {
      case 'keyword':
        return this.keywordSearch(opts)
      case 'semantic':
        return this.semanticSearch(opts)
      case 'relationship':
        return this.relationshipSearch(opts)
      case 'hybrid':
      default:
        return this.hybridSearch(opts)
    }
  }

  private async keywordSearch(opts: GraphSearchOptions): Promise<GraphSearchResult[]> {
    const limit = opts.maxNodes ?? this.config.maxSearchResults
    const entries = this.index.keywordSearch(opts.query, limit * 2, opts.nodeTypes)

    const results: GraphSearchResult[] = []
    for (const entry of entries) {
      const node = this.index.getNode(entry.nodeId)
      if (!node) continue
      if (opts.minImportance && node.importance < opts.minImportance) continue

      const edges = opts.includeEdges ? await this.graph.getEdgesForNode(node.id) : []
      const terms = opts.query.toLowerCase().split(/\s+/)
      const scored = this.scorer.score(node, edges, terms)

      results.push({
        node,
        score: scored.score,
        matchReason: `Keyword match in title or summary`,
        edges: opts.includeEdges ? edges : undefined,
      })
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  private async semanticSearch(opts: GraphSearchOptions): Promise<GraphSearchResult[]> {
    // Use Claude to identify relevant nodes from the query
    try {
      const client = new Anthropic({ apiKey: this.apiKey })
      const allEntries = this.index.getAllEntries()
      if (allEntries.length === 0) return []

      const nodeList = allEntries
        .slice(0, 200)
        .map((e) => `[${e.nodeId}] (${e.type}) ${e.title}`)
        .join('\n')

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
      })

      const textBlock = response.content.find((b) => b.type === 'text')
      const raw = textBlock?.type === 'text' ? textBlock.text.trim() : '[]'
      const match = raw.match(/\[[\s\S]*?\]/)
      const ids: string[] = match ? JSON.parse(match[0]) : []

      const results: GraphSearchResult[] = []
      for (const id of ids) {
        const node = this.index.getNode(id)
        if (!node) continue
        const edges = opts.includeEdges ? await this.graph.getEdgesForNode(node.id) : []
        const scored = this.scorer.score(node, edges, [])
        results.push({ node, score: scored.score, matchReason: 'Semantic match', edges: opts.includeEdges ? edges : undefined })
      }
      return results
    } catch {
      // Fall back to keyword if Claude fails
      return this.keywordSearch(opts)
    }
  }

  private async relationshipSearch(opts: GraphSearchOptions): Promise<GraphSearchResult[]> {
    // Find seed nodes by keyword, then traverse their relationships
    const seeds = await this.keywordSearch({ ...opts, mode: 'keyword', maxNodes: 3 })
    if (seeds.length === 0) return []

    const depth = opts.maxDepth ?? this.config.defaultTraversalDepth
    const nodeSet = new Map<string, GraphNode>()
    const edgeSet = new Map<string, import('./MemoryTypes').GraphEdge>()

    for (const seed of seeds) {
      nodeSet.set(seed.node.id, seed.node)
      const { nodes, edges } = await this.relationshipEngine.traverse(seed.node.id, depth)
      for (const n of nodes) nodeSet.set(n.id, n)
      for (const e of edges) edgeSet.set(e.id, e)
    }

    const results: GraphSearchResult[] = []
    for (const node of nodeSet.values()) {
      const nodeEdges = [...edgeSet.values()].filter((e) => e.fromId === node.id || e.toId === node.id)
      const scored = this.scorer.score(node, nodeEdges, opts.query.toLowerCase().split(/\s+/))
      results.push({
        node,
        score: scored.score,
        matchReason: seeds.some((s) => s.node.id === node.id) ? 'Seed node' : 'Relationship traversal',
        edges: opts.includeEdges ? nodeEdges : undefined,
      })
    }

    return results.sort((a, b) => b.score - a.score).slice(0, opts.maxNodes ?? this.config.maxSearchResults)
  }

  private async hybridSearch(opts: GraphSearchOptions): Promise<GraphSearchResult[]> {
    const [keyword, relationship] = await Promise.all([
      this.keywordSearch({ ...opts, mode: 'keyword', maxNodes: 10 }),
      this.relationshipSearch({ ...opts, mode: 'relationship', maxNodes: 10 }),
    ])

    // Merge and deduplicate, boosting nodes that appear in both
    const merged = new Map<string, GraphSearchResult>()
    for (const r of keyword) merged.set(r.node.id, r)
    for (const r of relationship) {
      const existing = merged.get(r.node.id)
      if (existing) {
        merged.set(r.node.id, { ...existing, score: Math.min(100, existing.score + r.score * 0.3), matchReason: 'Hybrid match' })
      } else {
        merged.set(r.node.id, r)
      }
    }

    return [...merged.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, opts.maxNodes ?? this.config.maxSearchResults)
  }
}
