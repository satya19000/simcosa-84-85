import Anthropic from '@anthropic-ai/sdk'
import type { DocumentChunk } from './DocumentTypes'
import { DocumentChunker } from './DocumentChunker'
import { DocumentSearch } from './DocumentSearch'
import type * as admin from 'firebase-admin'
import type { DocumentConfig } from './DocumentConfig'

export class DocumentRetriever {
  private readonly client: Anthropic
  private readonly chunker: DocumentChunker
  private readonly search: DocumentSearch

  constructor(
    db: admin.firestore.Firestore,
    config: DocumentConfig,
    apiKey: string
  ) {
    this.client = new Anthropic({ apiKey })
    this.chunker = new DocumentChunker(db)
    this.search = new DocumentSearch(db, config, apiKey)
  }

  async retrieve(userId: string, query: string, limit = 10): Promise<DocumentChunk[]> {
    const results = await this.search.search(userId, { query, mode: 'hybrid', limit })
    const chunks: DocumentChunk[] = []
    const seen = new Set<string>()
    for (const r of results) {
      if (seen.has(r.chunkId)) continue
      seen.add(r.chunkId)
      const docChunks = await this.chunker.getChunks(userId, r.documentId)
      const chunk = docChunks.find((c) => c.id === r.chunkId)
      if (chunk) chunks.push(chunk)
    }
    return chunks.slice(0, limit)
  }

  async chat(userId: string, documentId: string, question: string): Promise<string> {
    const chunks = await this.chunker.getChunks(userId, documentId)
    if (chunks.length === 0) return 'Document has no indexed content.'

    const context = chunks.map((c, i) => `[${i + 1}] ${c.text}`).join('\n\n').slice(0, 8000)

    try {
      const response = await this.client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Answer the question based on the document content below.

Document content:
${context}

Question: ${question}

Answer concisely and accurately based only on the document content.`,
          },
        ],
      })
      const textBlock = response.content.find((b) => b.type === 'text')
      return textBlock?.type === 'text' ? textBlock.text : 'Unable to answer.'
    } catch {
      return 'Unable to answer at this time.'
    }
  }

  async contextForQuery(userId: string, query: string, tokenBudget = 2000): Promise<string> {
    const chunks = await this.retrieve(userId, query, 15)
    let context = ''
    for (const chunk of chunks) {
      const addition = `\n\n[Document chunk]\n${chunk.text}`
      if ((context + addition).length / 4 > tokenBudget) break
      context += addition
    }
    return context.trim()
  }
}
