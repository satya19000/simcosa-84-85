import type * as admin from 'firebase-admin'
import type { MissionPermissionRecord, MissionRole } from './MissionTypes'

const COL = (userId: string) => `users/${userId}/missionPermissions`

/** Mirrors delegation/ApprovalPermissions.ts: per-scope role grants, hierarchical role check. */
export class MissionPermissions {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async grant(userId: string, scopeId: string, role: MissionRole): Promise<void> {
    const record: MissionPermissionRecord = {
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

  async get(userId: string, scopeId: string): Promise<MissionPermissionRecord | null> {
    const snap = await this.db.collection(COL(userId)).doc(scopeId).get()
    return snap.exists ? (snap.data() as MissionPermissionRecord) : null
  }

  async canAccess(userId: string, scopeId: string, minRole: MissionRole = 'reader'): Promise<boolean> {
    const record = await this.get(userId, scopeId)
    if (!record) return false
    const order: MissionRole[] = ['reader', 'planner', 'mission_admin', 'admin']
    return order.indexOf(record.role) >= order.indexOf(minRole)
  }
}
