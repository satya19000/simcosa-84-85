import Anthropic from '@anthropic-ai/sdk'
import type { GraphNode, GraphEdge, EdgeType, NodeType } from './MemoryTypes'
import type { MemoryGraph } from './MemoryGraph'
import type { MemoryConfig } from './MemoryConfig'

export interface ExtractedRelationship {
  fromTitle: string
  fromType: NodeType
  toTitle: string
  toType: NodeType
  edgeType: EdgeType
  weight: number
  confidence: number
  label?: string
}

/**
 * Uses Claude to infer graph relationships from unstructured text.
 * Stores high-confidence edges; discards low-confidence ones.
 */
export class RelationshipEngine {
  constructor(
    private readonly graph: MemoryGraph,
    private readonly config: MemoryConfig,
    private readonly apiKey: string
  ) {}

  /** Extract and persist relationships from free-form text. */
  async extractAndPersist(text: string, userId: string): Promise<GraphEdge[]> {
    const relationships = await this.extract(text)
    const persisted: GraphEdge[] = []

    for (const rel of relationships) {
      if (rel.confidence < this.config.minEdgeConfidence) continue

      const { node: fromNode } = await this.graph.upsertNode(rel.fromType, rel.fromTitle, '', {}, 60)
      const { node: toNode } = await this.graph.upsertNode(rel.toType, rel.toTitle, '', {}, 60)

      const { edge } = await this.graph.upsertEdge(fromNode.id, toNode.id, rel.edgeType, {
        weight: rel.weight,
        confidence: rel.confidence,
        label: rel.label,
        metadata: { source: 'relationship-engine', extractedFrom: text.slice(0, 200) },
      })
      persisted.push(edge)
    }

    return persisted
  }

  /** Pure extraction — no DB writes. */
  async extract(text: string): Promise<ExtractedRelationship[]> {
    try {
      const client = new Anthropic({ apiKey: this.apiKey })

      const prompt = `Extract relationships from this text and return a JSON array.
Each item: { "fromTitle": string, "fromType": NodeType, "toTitle": string, "toType": NodeType, "edgeType": EdgeType, "weight": 0-1, "confidence": 0-1, "label"?: string }

NodeType values: person, organization, hospital, office, project, meeting, task, reminder, location, document, conversation, preference, habit, vehicle, expense, health_record, public_health_program, custom
EdgeType values: KNOWS, WORKS_AT, BELONGS_TO, PART_OF, LOCATED_IN, MANAGES, ASSIGNED_TO, RELATED_TO, FOLLOW_UP, DEPENDS_ON, MENTIONED_IN, CREATED_BY, UPDATED_BY, ATTENDED, VISITED, CUSTOM

Text: "${text.replace(/"/g, "'")}"

Return ONLY a JSON array. No explanation.`

      const response = await client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      })

      const textBlock = response.content.find((b) => b.type === 'text')
      const raw = textBlock?.type === 'text' ? textBlock.text.trim() : '[]'
      const match = raw.match(/\[[\s\S]*\]/)
      if (!match) return []
      return JSON.parse(match[0]) as ExtractedRelationship[]
    } catch {
      return []
    }
  }

  /** Traverse the graph BFS up to maxDepth, collecting reachable nodes and edges. */
  async traverse(
    startNodeId: string,
    maxDepth: number,
    edgeTypes?: EdgeType[]
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const visited = new Set<string>([startNodeId])
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []
    let frontier = [startNodeId]

    for (let depth = 0; depth < maxDepth; depth++) {
      if (frontier.length === 0) break
      const nextFrontier: string[] = []

      await Promise.all(
        frontier.map(async (nodeId) => {
          const node = await this.graph.getNode(nodeId)
          if (node) nodes.push(node)

          const nodeEdges = await this.graph.getEdgesFrom(nodeId)
          for (const edge of nodeEdges) {
            if (edgeTypes && !edgeTypes.includes(edge.type)) continue
            edges.push(edge)
            if (!visited.has(edge.toId)) {
              visited.add(edge.toId)
              nextFrontier.push(edge.toId)
            }
          }
        })
      )

      frontier = nextFrontier
    }

    return { nodes, edges }
  }
}
