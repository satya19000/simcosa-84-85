import Anthropic from '@anthropic-ai/sdk'
import type { GraphSearchResult, GraphEdge } from './MemoryTypes'

/**
 * Reduces a set of graph search results into a compact text context
 * suitable for inclusion in Claude prompts.
 */
export class MemoryCompressor {
  constructor(private readonly apiKey: string) {}

  /**
   * Compress results into a text block within the token budget.
   * Uses AI summarization when results exceed the budget.
   */
  async compress(
    results: GraphSearchResult[],
    query: string,
    tokenBudget: number
  ): Promise<string> {
    if (results.length === 0) return ''

    const raw = this.formatRaw(results)
    const estimatedTokens = Math.ceil(raw.length / 4)

    if (estimatedTokens <= tokenBudget) {
      return raw
    }

    // Over budget — use Claude to summarize
    return this.aiCompress(raw, query, tokenBudget)
  }

  private formatRaw(results: GraphSearchResult[]): string {
    const lines: string[] = ['## Relevant Memory Context', '']

    for (const r of results) {
      const { node, edges } = r
      lines.push(`### ${node.title} (${node.type}, importance: ${node.importance})`)
      if (node.summary) lines.push(node.summary)

      if (edges && edges.length > 0) {
        const edgeLines = this.formatEdges(node.id, edges, results)
        if (edgeLines.length > 0) {
          lines.push('Relationships:')
          lines.push(...edgeLines)
        }
      }
      lines.push('')
    }

    return lines.join('\n')
  }

  private formatEdges(nodeId: string, edges: GraphEdge[], results: GraphSearchResult[]): string[] {
    const nodeIndex = new Map(results.map((r) => [r.node.id, r.node.title]))
    return edges
      .filter((e) => e.fromId === nodeId)
      .map((e) => {
        const targetTitle = nodeIndex.get(e.toId) ?? e.toId.slice(0, 8) + '…'
        return `  → ${e.type} → ${targetTitle} (weight: ${e.weight.toFixed(2)})`
      })
  }

  private async aiCompress(raw: string, query: string, tokenBudget: number): Promise<string> {
    try {
      const client = new Anthropic({ apiKey: this.apiKey })
      const charBudget = tokenBudget * 4

      const response = await client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: Math.min(1024, tokenBudget),
        messages: [
          {
            role: 'user',
            content: `Compress the following memory context to be relevant to the query: "${query}"
Keep it under ${charBudget} characters. Preserve names, relationships, and key facts. Remove low-relevance details.

${raw}

Return ONLY the compressed context, no explanation.`,
          },
        ],
      })

      const textBlock = response.content.find((b) => b.type === 'text')
      return textBlock?.type === 'text' ? textBlock.text : raw.slice(0, charBudget)
    } catch {
      // Truncate if AI fails
      return raw.slice(0, tokenBudget * 4)
    }
  }
}
