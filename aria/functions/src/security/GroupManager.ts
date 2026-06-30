import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { TenantEngine } from './TenantEngine'
import type { GroupRecord } from './SecurityTypes'

const GROUPS_COL = (tenantId: string) => `tenants/${tenantId}/groups`

/** Repository for tenants/{tenantId}/groups/{groupId}. Tenant-membership gated like every other Manager here. */
export class GroupManager {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly tenants: TenantEngine
  ) {}

  async createGroup(tenantId: string, actorUserId: string, input: { name: string; description?: string }): Promise<GroupRecord> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const groupId = uuidv4()
    const now = new Date().toISOString()
    const record: GroupRecord = {
      id: groupId,
      tenantId,
      groupId,
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      memberIdentityIds: [],
      roleIds: [],
      createdBy: actorUserId,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(GROUPS_COL(tenantId)).doc(groupId).set(record)
    return record
  }

  async updateGroup(tenantId: string, actorUserId: string, groupId: string, fields: Partial<Pick<GroupRecord, 'name' | 'description'>>): Promise<GroupRecord | null> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const ref = this.db.collection(GROUPS_COL(tenantId)).doc(groupId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ ...fields, updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as GroupRecord
  }

  async getGroup(tenantId: string, actorUserId: string, groupId: string): Promise<GroupRecord | null> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const snap = await this.db.collection(GROUPS_COL(tenantId)).doc(groupId).get()
    return snap.exists ? (snap.data() as GroupRecord) : null
  }

  async listGroups(tenantId: string, actorUserId: string): Promise<GroupRecord[]> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const snap = await this.db.collection(GROUPS_COL(tenantId)).get()
    return snap.docs.map((d) => d.data() as GroupRecord)
  }

  async addMemberToGroup(tenantId: string, actorUserId: string, groupId: string, identityId: string): Promise<GroupRecord | null> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const ref = this.db.collection(GROUPS_COL(tenantId)).doc(groupId)
    const snap = await ref.get()
    if (!snap.exists) return null
    const group = snap.data() as GroupRecord
    if (!group.memberIdentityIds.includes(identityId)) {
      await ref.update({ memberIdentityIds: [...group.memberIdentityIds, identityId], updatedAt: new Date().toISOString() })
    }
    const updated = await ref.get()
    return updated.data() as GroupRecord
  }

  async removeMemberFromGroup(tenantId: string, actorUserId: string, groupId: string, identityId: string): Promise<GroupRecord | null> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const ref = this.db.collection(GROUPS_COL(tenantId)).doc(groupId)
    const snap = await ref.get()
    if (!snap.exists) return null
    const group = snap.data() as GroupRecord
    await ref.update({ memberIdentityIds: group.memberIdentityIds.filter((id) => id !== identityId), updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as GroupRecord
  }

  async assignRoleToGroup(tenantId: string, actorUserId: string, groupId: string, roleId: string): Promise<GroupRecord | null> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const ref = this.db.collection(GROUPS_COL(tenantId)).doc(groupId)
    const snap = await ref.get()
    if (!snap.exists) return null
    const group = snap.data() as GroupRecord
    if (!group.roleIds.includes(roleId)) {
      await ref.update({ roleIds: [...group.roleIds, roleId], updatedAt: new Date().toISOString() })
    }
    const updated = await ref.get()
    return updated.data() as GroupRecord
  }
}
