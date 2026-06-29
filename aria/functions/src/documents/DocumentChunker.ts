import type * as admin from 'firebase-admin'
import type { DocumentChunk } from './DocumentTypes'

const COL = (userId: string) => `users/${userId}/documentChunks`

/**
 * Stores and retrieves document chunks.
 * Chunking logic lives in DocumentParser; this class is pure persistence.
 */
export class DocumentChunker {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async saveChunks(chunks: DocumentChunk[]): Promise<void> {
    if (chunks.length === 0) return
    const batch = this.db.batch()
    for (const chunk of chunks) {
      const ref = this.db.collection(COL(chunk.userId)).doc(chunk.id)
      batch.set(ref, chunk)
    }
    await batch.commit()
  }

  async getChunks(userId: string, documentId: string): Promise<DocumentChunk[]> {
    const snap = await this.db
      .collection(COL(userId))
      .where('documentId', '==', documentId)
      .orderBy('index')
      .get()
    return snap.docs.map((d) => d.data() as DocumentChunk)
  }

  async deleteChunks(userId: string, documentId: string): Promise<void> {
    const snap = await this.db
      .collection(COL(userId))
      .where('documentId', '==', documentId)
      .get()
    const batch = this.db.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }

  async countChunks(userId: string, documentId: string): Promise<number> {
    const snap = await this.db
      .collection(COL(userId))
      .where('documentId', '==', documentId)
      .count()
      .get()
    return snap.data().count
  }

  async searchChunks(userId: string, keyword: string, limit = 20): Promise<DocumentChunk[]> {
    // Firestore doesn't support full-text — load and filter in-memory (for small collections)
    // Production: use a proper search index or Algolia
    const snap = await this.db
      .collection(COL(userId))
      .limit(2000)
      .get()
    const lower = keyword.toLowerCase()
    return snap.docs
      .map((d) => d.data() as DocumentChunk)
      .filter((c) => c.text.toLowerCase().includes(lower))
      .slice(0, limit)
  }
}
