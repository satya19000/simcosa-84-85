import type * as admin from 'firebase-admin'
import type { ApprovalPermissionRecord, DelegationRole } from './ApprovalTypes'

const COL = (userId: string) => `users/${userId}/approvalPermissions`

export class ApprovalPermissions {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async grant(userId: string, scopeId: string, role: DelegationRole): Promise<void> {
    const record: ApprovalPermissionRecord = {
      userId,
      scopeId,
      role,
      grantedAt: new Date().toISOString(),
    }
    await this.db.collection(COL(userId)).doc(scopeId).set(record)
  }

  async revoke(userId: string, scopeId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(scopeId).delete()
  }

  async get(userId: string, scopeId: string): Promise<ApprovalPermissionRecord | null> {
    const snap = await this.db.collection(COL(userId)).doc(scopeId).get()
    return snap.exists ? (snap.data() as ApprovalPermissionRecord) : null
  }

  async canAccess(userId: string, scopeId: string, minRole: DelegationRole = 'reader'): Promise<boolean> {
    const record = await this.get(userId, scopeId)
    if (!record) return false
    const order: DelegationRole[] = ['reader', 'approver', 'manager', 'executive', 'admin']
    return order.indexOf(record.role) >= order.indexOf(minRole)
  }
}
