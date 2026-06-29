import Anthropic from '@anthropic-ai/sdk'
import type * as admin from 'firebase-admin'
import type { DocumentRecord, ExtractedEntity } from './DocumentTypes'
import { getMemoryGraph, getGraphBuilder } from '../memory-graph'

export class DocumentRelations {
  private readonly client: Anthropic

  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly apiKey: string
  ) {
    this.client = new Anthropic({ apiKey: this.apiKey })
  }

  async linkToMemoryGraph(document: DocumentRecord, text: string, entities: ExtractedEntity[]): Promise<void> {
    try {
      const graph = getMemoryGraph(document.userId, this.db, this.apiKey)
      const builder = getGraphBuilder(document.userId, this.db, this.apiKey)

      const { node: docNode } = await graph.upsertNode(
        'document',
        document.title,
        `${document.category} document — ${document.format}`,
        { documentId: document.id, category: document.category, format: document.format },
        40
      )

      for (const entity of entities) {
        if (entity.type === 'person') {
          const { node: personNode } = await graph.upsertNode(
            'person',
            entity.value,
            `Person mentioned in ${document.title}`,
            { source: 'document', documentId: document.id },
            50
          )
          await graph.upsertEdge(docNode.id, personNode.id, 'MENTIONED_IN', {
            weight: entity.confidence,
            confidence: entity.confidence,
            metadata: { context: entity.context },
          })
        } else if (entity.type === 'organization' || entity.type === 'hospital') {
          const nodeType = entity.type === 'hospital' ? 'hospital' : 'organization'
          const { node: orgNode } = await graph.upsertNode(
            nodeType,
            entity.value,
            `Organization mentioned in ${document.title}`,
            { source: 'document', documentId: document.id },
            45
          )
          await graph.upsertEdge(docNode.id, orgNode.id, 'MENTIONED_IN', {
            weight: entity.confidence,
            confidence: entity.confidence,
          })
        }
      }

      await builder.buildFromChat({
        messageId: `doc-${document.id}`,
        text: text.slice(0, 2000),
        role: 'assistant',
      })
    } catch {
      // Graph linking is best-effort
    }
  }

  async extractEntities(document: DocumentRecord, text: string): Promise<ExtractedEntity[]> {
    if (text.length < 20) return []

    try {
      const response = await this.client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Extract named entities from this document text as a JSON array:
[
  { "type": "person|organization|hospital|medicine|disease|program|location|date|phone|email|project|task|reminder|amount|percentage|custom", "value": "string", "context": "surrounding text", "confidence": 0.0-1.0 }
]

Document: "${document.title}"
Text (first 2000 chars): ${text.slice(0, 2000)}

Return ONLY valid JSON array.`,
          },
        ],
      })

      const textBlock = response.content.find((b) => b.type === 'text')
      const raw = textBlock?.type === 'text' ? textBlock.text : '[]'
      const match = raw.match(/\[[\s\S]*\]/)
      if (!match) return []
      return JSON.parse(match[0]) as ExtractedEntity[]
    } catch {
      return []
    }
  }
}
