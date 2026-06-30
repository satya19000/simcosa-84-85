import type * as admin from 'firebase-admin'
import type { HealthPermissionRecord, HealthRole } from './HealthTypes'

const COL = (userId: string) => `users/${userId}/healthPermissions`

export class HealthPermissions {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async grant(userId: string, patientId: string, role: HealthRole): Promise<void> {
    const record: HealthPermissionRecord = {
      userId,
      patientId,
      role,
      grantedAt: new Date().toISOString(),
    }
    await this.db.collection(COL(userId)).doc(patientId).set(record)
  }

  async revoke(userId: string, patientId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(patientId).delete()
  }

  async get(userId: string, patientId: string): Promise<HealthPermissionRecord | null> {
    const snap = await this.db.collection(COL(userId)).doc(patientId).get()
    return snap.exists ? (snap.data() as HealthPermissionRecord) : null
  }

  async canAccess(userId: string, patientId: string, minRole: HealthRole = 'reader'): Promise<boolean> {
    const record = await this.get(userId, patientId)
    if (!record) return false
    const order: HealthRole[] = ['reader', 'health_worker', 'doctor', 'admin']
    return order.indexOf(record.role) >= order.indexOf(minRole)
  }
}
