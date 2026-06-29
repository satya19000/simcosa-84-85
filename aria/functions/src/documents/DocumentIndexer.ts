import type * as admin from 'firebase-admin'
import type { DocumentRecord } from './DocumentTypes'
import type { DocumentConfig } from './DocumentConfig'

interface IndexEntry {
  documentId: string
  userId: string
  title: string
  keywords: string[]
  category: string
  format: string
  tags: string[]
  updatedAt: string
}

interface IndexCache {
  entries: IndexEntry[]
  builtAt: number
}

const caches = new Map<string, IndexCache>()

export class DocumentIndexer {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly config: DocumentConfig
  ) {}

  async search(userId: string, query: string, limit = 20): Promise<IndexEntry[]> {
    const index = await this.getOrBuild(userId)
    const lower = query.toLowerCase()
    const terms = lower.split(/\s+/).filter(Boolean)
    const scored: Array<{ entry: IndexEntry; score: number }> = []
    for (const entry of index.entries) {
      const haystack = [entry.title, ...entry.keywords, ...entry.tags, entry.category].join(' ').toLowerCase()
      const score = terms.filter((t) => haystack.includes(t)).length
      if (score > 0) scored.push({ entry, score })
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.entry)
  }

  async rebuild(userId: string): Promise<void> {
    const snap = await this.db
      .collection(`users/${userId}/documents`)
      .where('status', '!=', 'deleted')
      .get()
    const entries: IndexEntry[] = snap.docs.map((d) => {
      const rec = d.data() as DocumentRecord
      return {
        documentId: rec.id,
        userId: rec.userId,
        title: rec.title,
        keywords: rec.tags ?? [],
        category: rec.category,
        format: rec.format,
        tags: rec.tags ?? [],
        updatedAt: rec.updatedAt,
      }
    })
    caches.set(userId, { entries, builtAt: Date.now() })
  }

  async addEntry(userId: string, record: DocumentRecord): Promise<void> {
    const cache = caches.get(userId)
    if (!cache) return
    const entry: IndexEntry = {
      documentId: record.id,
      userId: record.userId,
      title: record.title,
      keywords: record.tags ?? [],
      category: record.category,
      format: record.format,
      tags: record.tags ?? [],
      updatedAt: record.updatedAt,
    }
    cache.entries.push(entry)
  }

  async removeEntry(userId: string, documentId: string): Promise<void> {
    const cache = caches.get(userId)
    if (!cache) return
    cache.entries = cache.entries.filter((e) => e.documentId !== documentId)
  }

  clearCache(userId: string): void {
    caches.delete(userId)
  }

  private async getOrBuild(userId: string): Promise<IndexCache> {
    const existing = caches.get(userId)
    if (existing && Date.now() - existing.builtAt < this.config.indexCacheTTLMs) return existing
    await this.rebuild(userId)
    return caches.get(userId)!
  }
}
