import type { GraphNode, GraphEdge } from './MemoryTypes'
import type { MemoryConfig } from './MemoryConfig'

export interface ScoredNode {
  node: GraphNode
  score: number
  factors: {
    importance: number
    recency: number
    frequency: number
    relationshipStrength: number
    pinBonus: number
  }
}

/**
 * Scores graph nodes for retrieval ranking.
 * Score is 0-100 combining importance, recency, frequency, and relationship strength.
 */
export class MemoryScorer {
  constructor(private readonly config: MemoryConfig) {}

  score(node: GraphNode, edges: GraphEdge[], queryTerms: string[] = []): ScoredNode {
    const importance = node.importance * 0.35

    const ageMs = Date.now() - new Date(node.updatedAt).getTime()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)
    const recency = Math.max(0, 100 - ageDays * this.config.recencyDecayPerDay) * 0.25

    // Frequency proxy: number of connected edges
    const frequency = Math.min(edges.length * 5, 20) // 0-20

    // Relationship strength: average edge weight
    const avgWeight = edges.length > 0
      ? edges.reduce((sum, e) => sum + e.weight, 0) / edges.length
      : 0
    const relationshipStrength = avgWeight * 15 // 0-15

    const pinBonus = node.pinned ? 10 : 0

    // Query relevance bonus
    let relevance = 0
    if (queryTerms.length > 0) {
      const titleLower = node.title.toLowerCase()
      for (const term of queryTerms) {
        if (titleLower.includes(term)) relevance += 5
      }
      relevance = Math.min(relevance, 15)
    }

    const score = Math.min(100, importance + recency + frequency + relationshipStrength + pinBonus + relevance)

    return {
      node,
      score,
      factors: {
        importance,
        recency,
        frequency,
        relationshipStrength,
        pinBonus,
      },
    }
  }

  rankNodes(
    nodesWithEdges: Array<{ node: GraphNode; edges: GraphEdge[] }>,
    queryTerms: string[] = []
  ): ScoredNode[] {
    return nodesWithEdges
      .map(({ node, edges }) => this.score(node, edges, queryTerms))
      .sort((a, b) => b.score - a.score)
  }
}
