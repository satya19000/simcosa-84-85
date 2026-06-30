import type * as admin from 'firebase-admin'
import type { FinancePermissionRecord, FinanceRole } from './FinanceTypes'

const COL = (userId: string) => `users/${userId}/financePermissions`

export class FinancePermissions {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async grant(userId: string, scopeId: string, role: FinanceRole): Promise<void> {
    const record: FinancePermissionRecord = {
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

  async get(userId: string, scopeId: string): Promise<FinancePermissionRecord | null> {
    const snap = await this.db.collection(COL(userId)).doc(scopeId).get()
    return snap.exists ? (snap.data() as FinancePermissionRecord) : null
  }

  async canAccess(userId: string, scopeId: string, minRole: FinanceRole = 'reader'): Promise<boolean> {
    const record = await this.get(userId, scopeId)
    if (!record) return false
    const order: FinanceRole[] = ['reader', 'approver', 'finance_admin', 'admin']
    return order.indexOf(record.role) >= order.indexOf(minRole)
  }
}
