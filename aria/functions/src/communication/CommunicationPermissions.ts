import type * as admin from 'firebase-admin'
import type { CommunicationPermissionRecord, CommunicationRole } from './CommunicationTypes'

const COL = (userId: string) => `users/${userId}/communicationPermissions`

export class CommunicationPermissions {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async grant(userId: string, threadId: string, role: CommunicationRole): Promise<void> {
    const record: CommunicationPermissionRecord = {
      userId,
      threadId,
      role,
      grantedAt: new Date().toISOString(),
    }
    await this.db.collection(COL(userId)).doc(threadId).set(record)
  }

  async revoke(userId: string, threadId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(threadId).delete()
  }

  async get(userId: string, threadId: string): Promise<CommunicationPermissionRecord | null> {
    const snap = await this.db.collection(COL(userId)).doc(threadId).get()
    return snap.exists ? (snap.data() as CommunicationPermissionRecord) : null
  }

  async canAccess(userId: string, threadId: string, minRole: CommunicationRole = 'reader'): Promise<boolean> {
    const record = await this.get(userId, threadId)
    if (!record) return false
    const order: CommunicationRole[] = ['reader', 'agent', 'plugin', 'owner']
    return order.indexOf(record.role) >= order.indexOf(minRole)
  }
}
