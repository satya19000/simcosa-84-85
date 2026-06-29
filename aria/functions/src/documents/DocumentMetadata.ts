import type * as admin from 'firebase-admin'
import type { DocumentMetadataRecord } from './DocumentTypes'

const COL = (userId: string) => `users/${userId}/documentMetadata`

export class DocumentMetadata {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async save(record: DocumentMetadataRecord): Promise<void> {
    await this.db.collection(COL(record.userId)).doc(record.documentId).set(record)
  }

  async get(userId: string, documentId: string): Promise<DocumentMetadataRecord | null> {
    const snap = await this.db.collection(COL(userId)).doc(documentId).get()
    return snap.exists ? (snap.data() as DocumentMetadataRecord) : null
  }

  async update(userId: string, documentId: string, patch: Partial<DocumentMetadataRecord>): Promise<void> {
    await this.db.collection(COL(userId)).doc(documentId).set(patch, { merge: true })
  }
}
