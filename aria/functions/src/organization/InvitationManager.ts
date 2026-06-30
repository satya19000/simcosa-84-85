import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { InvitationRecord, MemberRole } from './WorkspaceTypes'

const COL = (organizationId: string) => `organizations/${organizationId}/invitations`

/** Repository for organizations/{organizationId}/invitations/{invitationId}. Owns ALL raw Firestore access for this collection. */
export class InvitationManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async create(
    organizationId: string,
    createdBy: string,
    input: { email: string; role: MemberRole; workspaceId?: string | null; expiresAt: string }
  ): Promise<InvitationRecord> {
    const invitationId = uuidv4()
    const now = new Date().toISOString()
    const record: InvitationRecord = {
      id: invitationId,
      organizationId,
      invitationId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      workspaceId: input.workspaceId ?? null,
      status: 'pending',
      invitedBy: createdBy,
      createdBy,
      createdAt: now,
      updatedAt: now,
      expiresAt: input.expiresAt,
      acceptedBy: null,
      acceptedAt: null,
    }
    await this.db.collection(COL(organizationId)).doc(invitationId).set(record)
    return record
  }

  async get(organizationId: string, invitationId: string): Promise<InvitationRecord | null> {
    const snap = await this.db.collection(COL(organizationId)).doc(invitationId).get()
    return snap.exists ? (snap.data() as InvitationRecord) : null
  }

  async list(organizationId: string): Promise<InvitationRecord[]> {
    const snap = await this.db.collection(COL(organizationId)).orderBy('createdAt', 'desc').get()
    return snap.docs.map((d) => d.data() as InvitationRecord)
  }

  async markAccepted(organizationId: string, invitationId: string, acceptedBy: string): Promise<InvitationRecord | null> {
    const ref = this.db.collection(COL(organizationId)).doc(invitationId)
    const snap = await ref.get()
    if (!snap.exists) return null
    const now = new Date().toISOString()
    await ref.update({ status: 'accepted', acceptedBy, acceptedAt: now, updatedAt: now })
    const updated = await ref.get()
    return updated.data() as InvitationRecord
  }

  async markDeclined(organizationId: string, invitationId: string): Promise<InvitationRecord | null> {
    const ref = this.db.collection(COL(organizationId)).doc(invitationId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ status: 'declined', updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as InvitationRecord
  }

  async revoke(organizationId: string, invitationId: string): Promise<InvitationRecord | null> {
    const ref = this.db.collection(COL(organizationId)).doc(invitationId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ status: 'revoked', updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as InvitationRecord
  }

  async markExpired(organizationId: string, invitationId: string): Promise<InvitationRecord | null> {
    const ref = this.db.collection(COL(organizationId)).doc(invitationId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ status: 'expired', updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as InvitationRecord
  }
}
