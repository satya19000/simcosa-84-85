import type * as admin from 'firebase-admin'
import type { DocumentRecord, DocumentStatus, DocumentCategory, DocumentFormat } from './DocumentTypes'
import { v4 as uuidv4 } from 'uuid'

const COL = (userId: string) => `users/${userId}/documents`
const FOLDERS_COL = (userId: string) => `users/${userId}/documentFolders`

/**
 * Firestore persistence layer for DocumentRecord.
 * All document reads/writes go through this class.
 */
export class DocumentRegistry {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async create(
    userId: string,
    fields: Omit<DocumentRecord, 'id' | 'userId' | 'version' | 'createdAt' | 'updatedAt'>
  ): Promise<DocumentRecord> {
    const now = new Date().toISOString()
    const record: DocumentRecord = {
      ...fields,
      id: uuidv4(),
      userId,
      version: 1,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(COL(userId)).doc(record.id).set(record)
    return record
  }

  async get(userId: string, documentId: string): Promise<DocumentRecord | null> {
    const snap = await this.db.collection(COL(userId)).doc(documentId).get()
    return snap.exists ? (snap.data() as DocumentRecord) : null
  }

  async update(userId: string, documentId: string, patch: Partial<DocumentRecord>): Promise<DocumentRecord | null> {
    const existing = await this.get(userId, documentId)
    if (!existing) return null
    const updated: DocumentRecord = {
      ...existing,
      ...patch,
      id: documentId,
      userId,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    }
    await this.db.collection(COL(userId)).doc(documentId).set(updated)
    return updated
  }

  async setStatus(userId: string, documentId: string, status: DocumentStatus, error?: string): Promise<void> {
    const patch: Partial<DocumentRecord> = { status, updatedAt: new Date().toISOString() }
    if (error) patch.processingError = error
    if (status === 'indexed') patch.processedAt = new Date().toISOString()
    await this.db.collection(COL(userId)).doc(documentId).set(patch, { merge: true })
  }

  async softDelete(userId: string, documentId: string): Promise<void> {
    await this.setStatus(userId, documentId, 'deleted')
  }

  async list(
    userId: string,
    opts: { limit?: number; category?: DocumentCategory; format?: DocumentFormat; folderId?: string | null } = {}
  ): Promise<DocumentRecord[]> {
    let query: admin.firestore.Query = this.db
      .collection(COL(userId))
      .where('status', '!=', 'deleted')

    if (opts.category) query = query.where('category', '==', opts.category)
    if (opts.format) query = query.where('format', '==', opts.format)
    if (opts.folderId !== undefined) query = query.where('folderId', '==', opts.folderId)

    const snap = await query.orderBy('updatedAt', 'desc').limit(opts.limit ?? 100).get()
    return snap.docs.map((d) => d.data() as DocumentRecord)
  }

  async listRecent(userId: string, days = 7, limit = 20): Promise<DocumentRecord[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const snap = await this.db
      .collection(COL(userId))
      .where('createdAt', '>=', since)
      .where('status', '!=', 'deleted')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map((d) => d.data() as DocumentRecord)
  }

  async count(userId: string): Promise<number> {
    const snap = await this.db
      .collection(COL(userId))
      .where('status', '!=', 'deleted')
      .count()
      .get()
    return snap.data().count
  }

  async createFolder(userId: string, name: string, parentId?: string, color?: string) {
    const now = new Date().toISOString()
    const folder = { id: uuidv4(), userId, name, parentId, color, createdAt: now, updatedAt: now }
    await this.db.collection(FOLDERS_COL(userId)).doc(folder.id).set(folder)
    return folder
  }

  async listFolders(userId: string) {
    const snap = await this.db.collection(FOLDERS_COL(userId)).orderBy('name').get()
    return snap.docs.map((d) => d.data())
  }
}
