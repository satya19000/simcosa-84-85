import type * as admin from 'firebase-admin'
import type { EmbeddingProvider, EmbeddingVector, DocumentChunk } from './DocumentTypes'
import { v4 as uuidv4 } from 'uuid'

const COL = (userId: string) => `users/${userId}/documentEmbeddings`

// ── No-op provider (default until a vector DB is configured) ──────────────────

class NoOpEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'noop'
  readonly dimensions = 0
  async embed(_texts: string[]): Promise<number[][]> { return [] }
  async embedOne(_text: string): Promise<number[]> { return [] }
}

// ── Registry ──────────────────────────────────────────────────────────────────

const providers = new Map<string, EmbeddingProvider>()
providers.set('noop', new NoOpEmbeddingProvider())

export function registerEmbeddingProvider(provider: EmbeddingProvider): void {
  providers.set(provider.name, provider)
}

export function getEmbeddingProvider(name: string): EmbeddingProvider {
  return providers.get(name) ?? providers.get('noop')!
}

// ── Storage ───────────────────────────────────────────────────────────────────

export class DocumentEmbeddings {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly providerName: string
  ) {}

  async embedChunks(chunks: DocumentChunk[]): Promise<EmbeddingVector[]> {
    const provider = getEmbeddingProvider(this.providerName)
    if (provider.dimensions === 0 || chunks.length === 0) return []

    const texts = chunks.map((c) => c.text)
    const vectors = await provider.embed(texts)

    const results: EmbeddingVector[] = []
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]!
      const vector = vectors[i]
      if (!vector || vector.length === 0) continue

      const record: EmbeddingVector = {
        id: uuidv4(),
        documentId: chunk.documentId,
        chunkId: chunk.id,
        userId: chunk.userId,
        provider: this.providerName,
        dimensions: provider.dimensions,
        vector,
        createdAt: new Date().toISOString(),
      }
      await this.db.collection(COL(chunk.userId)).doc(record.id).set(record)
      results.push(record)
    }
    return results
  }

  /** Cosine similarity search (client-side — use Vertex AI / Pinecone for production). */
  async similaritySearch(
    userId: string,
    queryVector: number[],
    limit = 10
  ): Promise<Array<{ embeddingId: string; chunkId: string; documentId: string; score: number }>> {
    const snap = await this.db.collection(COL(userId)).limit(500).get()
    const results = snap.docs
      .map((d) => {
        const rec = d.data() as EmbeddingVector
        return { embeddingId: rec.id, chunkId: rec.chunkId, documentId: rec.documentId, score: cosine(queryVector, rec.vector) }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
    return results
  }
}

function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!
    normA += a[i]! * a[i]!
    normB += b[i]! * b[i]!
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}
