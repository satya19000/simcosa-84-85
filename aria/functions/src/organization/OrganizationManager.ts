import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { OrganizationRecord, OrganizationType, MemberRole } from './WorkspaceTypes'

const COL = 'organizations'

/** Repository for organizations/{organizationId}. Owns ALL raw Firestore access for this collection. */
export class OrganizationManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async create(
    createdBy: string,
    input: { name: string; type: OrganizationType; description?: string; defaultMemberRole?: MemberRole }
  ): Promise<OrganizationRecord> {
    const organizationId = uuidv4()
    const now = new Date().toISOString()
    const record: OrganizationRecord = {
      id: organizationId,
      organizationId,
      name: input.name.trim(),
      type: input.type,
      description: input.description?.trim() ?? '',
      ownerId: createdBy,
      createdBy,
      createdAt: now,
      updatedAt: now,
      settings: {
        allowGuestInvites: false,
        defaultMemberRole: input.defaultMemberRole ?? 'staff',
      },
    }
    await this.db.collection(COL).doc(organizationId).set(record)
    return record
  }

  async get(organizationId: string): Promise<OrganizationRecord | null> {
    const snap = await this.db.collection(COL).doc(organizationId).get()
    return snap.exists ? (snap.data() as OrganizationRecord) : null
  }

  async update(
    organizationId: string,
    fields: Partial<Pick<OrganizationRecord, 'name' | 'description' | 'type'>>
  ): Promise<OrganizationRecord | null> {
    const ref = this.db.collection(COL).doc(organizationId)
    const snap = await ref.get()
    if (!snap.exists) return null
    const updates: Record<string, unknown> = { ...fields, updatedAt: new Date().toISOString() }
    await ref.update(updates)
    const updated = await ref.get()
    return updated.data() as OrganizationRecord
  }

  async listForUser(userIdOrganizationIds: string[]): Promise<OrganizationRecord[]> {
    if (userIdOrganizationIds.length === 0) return []
    // Firestore 'in' supports up to 30 ids per query in current SDKs; chunk defensively.
    const chunks: string[][] = []
    for (let i = 0; i < userIdOrganizationIds.length; i += 30) {
      chunks.push(userIdOrganizationIds.slice(i, i + 30))
    }
    const results: OrganizationRecord[] = []
    for (const chunk of chunks) {
      const snap = await this.db.collection(COL).where('organizationId', 'in', chunk).get()
      results.push(...snap.docs.map((d) => d.data() as OrganizationRecord))
    }
    return results
  }
}
