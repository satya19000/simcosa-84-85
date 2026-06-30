import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { WorkspaceRecord } from './WorkspaceTypes'

const COL = (organizationId: string) => `organizations/${organizationId}/workspaces`

/** Repository for organizations/{organizationId}/workspaces/{workspaceId}. Owns ALL raw Firestore access for this collection. */
export class WorkspaceManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async create(
    organizationId: string,
    createdBy: string,
    input: { name: string; description?: string }
  ): Promise<WorkspaceRecord> {
    const workspaceId = uuidv4()
    const now = new Date().toISOString()
    const record: WorkspaceRecord = {
      id: workspaceId,
      organizationId,
      workspaceId,
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      managerIds: [createdBy],
      createdBy,
      createdAt: now,
      updatedAt: now,
      archived: false,
    }
    await this.db.collection(COL(organizationId)).doc(workspaceId).set(record)
    return record
  }

  async get(organizationId: string, workspaceId: string): Promise<WorkspaceRecord | null> {
    const snap = await this.db.collection(COL(organizationId)).doc(workspaceId).get()
    return snap.exists ? (snap.data() as WorkspaceRecord) : null
  }

  async list(organizationId: string): Promise<WorkspaceRecord[]> {
    const snap = await this.db.collection(COL(organizationId)).orderBy('createdAt', 'desc').get()
    return snap.docs.map((d) => d.data() as WorkspaceRecord)
  }

  async count(organizationId: string): Promise<number> {
    const snap = await this.db.collection(COL(organizationId)).count().get()
    return snap.data().count
  }

  async update(
    organizationId: string,
    workspaceId: string,
    fields: Partial<Pick<WorkspaceRecord, 'name' | 'description' | 'archived'>>
  ): Promise<WorkspaceRecord | null> {
    const ref = this.db.collection(COL(organizationId)).doc(workspaceId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ ...fields, updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as WorkspaceRecord
  }

  async addManager(organizationId: string, workspaceId: string, userId: string): Promise<void> {
    const ref = this.db.collection(COL(organizationId)).doc(workspaceId)
    const snap = await ref.get()
    if (!snap.exists) return
    const record = snap.data() as WorkspaceRecord
    if (!record.managerIds.includes(userId)) {
      await ref.update({ managerIds: [...record.managerIds, userId], updatedAt: new Date().toISOString() })
    }
  }
}
