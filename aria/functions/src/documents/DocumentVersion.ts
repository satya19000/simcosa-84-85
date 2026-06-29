import type * as admin from 'firebase-admin'
import type { DocumentVersion as DocVersion } from './DocumentTypes'
import { v4 as uuidv4 } from 'uuid'

const COL = (userId: string) => `users/${userId}/documentVersions`

export class DocumentVersionManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async save(
    userId: string,
    documentId: string,
    version: number,
    storageRef: string,
    sizeBytes: number,
    changeNote?: string
  ): Promise<DocVersion> {
    const record: DocVersion = {
      id: uuidv4(),
      documentId,
      userId,
      version,
      storageRef,
      sizeBytes,
      changeNote,
      uploadedAt: new Date().toISOString(),
    }
    await this.db.collection(COL(userId)).doc(record.id).set(record)
    return record
  }

  async listVersions(userId: string, documentId: string): Promise<DocVersion[]> {
    const snap = await this.db
      .collection(COL(userId))
      .where('documentId', '==', documentId)
      .orderBy('version', 'desc')
      .get()
    return snap.docs.map((d) => d.data() as DocVersion)
  }

  async getVersion(userId: string, versionId: string): Promise<DocVersion | null> {
    const snap = await this.db.collection(COL(userId)).doc(versionId).get()
    return snap.exists ? (snap.data() as DocVersion) : null
  }
}
