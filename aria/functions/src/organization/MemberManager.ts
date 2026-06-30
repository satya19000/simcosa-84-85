import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { MemberRecord, MemberRole } from './WorkspaceTypes'

const COL = (organizationId: string) => `organizations/${organizationId}/members`

/** Repository for organizations/{organizationId}/members/{memberId}. Owns ALL raw Firestore access for this collection. */
export class MemberManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async addMember(
    organizationId: string,
    createdBy: string,
    input: { userId: string; displayName: string; email: string; role: MemberRole; workspaceIds?: string[] }
  ): Promise<MemberRecord> {
    const memberId = uuidv4()
    const now = new Date().toISOString()
    const record: MemberRecord = {
      id: memberId,
      organizationId,
      memberId,
      userId: input.userId,
      displayName: input.displayName,
      email: input.email,
      role: input.role,
      workspaceIds: input.workspaceIds ?? [],
      status: 'active',
      createdBy,
      createdAt: now,
      updatedAt: now,
      joinedAt: now,
    }
    await this.db.collection(COL(organizationId)).doc(memberId).set(record)
    return record
  }

  async get(organizationId: string, memberId: string): Promise<MemberRecord | null> {
    const snap = await this.db.collection(COL(organizationId)).doc(memberId).get()
    return snap.exists ? (snap.data() as MemberRecord) : null
  }

  async getByUserId(organizationId: string, userId: string): Promise<MemberRecord | null> {
    const snap = await this.db.collection(COL(organizationId)).where('userId', '==', userId).limit(1).get()
    if (snap.empty) return null
    return snap.docs[0].data() as MemberRecord
  }

  async list(organizationId: string): Promise<MemberRecord[]> {
    const snap = await this.db.collection(COL(organizationId)).orderBy('createdAt', 'asc').get()
    return snap.docs.map((d) => d.data() as MemberRecord)
  }

  async count(organizationId: string): Promise<number> {
    const snap = await this.db.collection(COL(organizationId)).where('status', '==', 'active').count().get()
    return snap.data().count
  }

  async updateRole(organizationId: string, memberId: string, role: MemberRole): Promise<MemberRecord | null> {
    const ref = this.db.collection(COL(organizationId)).doc(memberId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ role, updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as MemberRecord
  }

  async addWorkspace(organizationId: string, memberId: string, workspaceId: string): Promise<void> {
    const ref = this.db.collection(COL(organizationId)).doc(memberId)
    const snap = await ref.get()
    if (!snap.exists) return
    const record = snap.data() as MemberRecord
    if (!record.workspaceIds.includes(workspaceId)) {
      await ref.update({ workspaceIds: [...record.workspaceIds, workspaceId], updatedAt: new Date().toISOString() })
    }
  }

  async remove(organizationId: string, memberId: string): Promise<MemberRecord | null> {
    const ref = this.db.collection(COL(organizationId)).doc(memberId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ status: 'removed', updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as MemberRecord
  }
}
