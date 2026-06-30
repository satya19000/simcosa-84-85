import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { ApprovalEngine, CreateApprovalRequestInput } from '../delegation/ApprovalEngine'
import type { ApprovalRequest } from '../delegation/ApprovalTypes'
import type { MissionEngine } from '../mission-control/MissionEngine'
import type { Mission } from '../mission-control/MissionTypes'
import type { SharedMissionRecord, SharedTaskRecord } from './WorkspaceTypes'

const SHARED_MISSIONS_COL = (organizationId: string) => `organizations/${organizationId}/sharedMissions`
const SHARED_TASKS_COL = (organizationId: string) => `organizations/${organizationId}/sharedTasks`

/**
 * The ONLY path by which the organization module touches Mission Control or
 * the Approval Engine. Mirrors MissionApprovalBridge.ts's no-bypass pattern
 * exactly: this class never executes anything itself, never decides risk,
 * never marks a shared task "completed" on its own authority. It only:
 *   (a) calls the real MissionEngine to create/read missions, then records a
 *       thin sharedMissions pointer doc linking that mission to a workspace
 *       and assigned members,
 *   (b) calls the real ApprovalEngine.createApprovalRequest for shared
 *       approval requests, and links the resulting ApprovalRequest id onto
 *       the sharedTask record so its status can be queried later.
 * Completion/approval state always lives in MissionEngine/ApprovalEngine —
 * this bridge only mirrors pointers and metadata into the org-scoped
 * collections so the organization UI can list/filter by workspace.
 */
export class DelegationManager {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly missionEngine: MissionEngine,
    private readonly approvalEngine: ApprovalEngine
  ) {}

  // ── Mission assignment ──────────────────────────────────────────────────

  async assignMissionToWorkspace(
    organizationId: string,
    actorUserId: string,
    workspaceId: string,
    underlyingMissionId: string,
    assignedMemberIds: string[]
  ): Promise<SharedMissionRecord> {
    // Read-through the real mission, never duplicate its fields/state.
    const mission: Mission | null = await this.missionEngine.getMission(actorUserId, underlyingMissionId)
    if (!mission) {
      throw new Error(`Cannot assign mission ${underlyingMissionId}: not found for user ${actorUserId}`)
    }

    const sharedMissionId = uuidv4()
    const now = new Date().toISOString()
    const record: SharedMissionRecord = {
      id: sharedMissionId,
      organizationId,
      missionId: sharedMissionId,
      workspaceId,
      underlyingMissionId,
      assignedMemberIds,
      status: mission.status,
      createdBy: actorUserId,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(SHARED_MISSIONS_COL(organizationId)).doc(sharedMissionId).set(record)
    return record
  }

  async listSharedMissions(organizationId: string, workspaceId?: string): Promise<SharedMissionRecord[]> {
    let query = this.db.collection(SHARED_MISSIONS_COL(organizationId)).orderBy('createdAt', 'desc') as admin.firestore.Query
    if (workspaceId) {
      query = this.db.collection(SHARED_MISSIONS_COL(organizationId)).where('workspaceId', '==', workspaceId)
    }
    const snap = await query.get()
    return snap.docs.map((d) => d.data() as SharedMissionRecord)
  }

  async countCompletedMissions(organizationId: string): Promise<number> {
    const snap = await this.db
      .collection(SHARED_MISSIONS_COL(organizationId))
      .where('status', '==', 'completed')
      .count()
      .get()
    return snap.data().count
  }

  // ── Task delegation ──────────────────────────────────────────────────────

  async delegateTask(
    organizationId: string,
    actorUserId: string,
    workspaceId: string,
    input: { title: string; description?: string; assignedTo?: string | null }
  ): Promise<SharedTaskRecord> {
    const taskId = uuidv4()
    const now = new Date().toISOString()
    const record: SharedTaskRecord = {
      id: taskId,
      organizationId,
      taskId,
      workspaceId,
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      assignedTo: input.assignedTo ?? null,
      delegatedBy: actorUserId,
      status: 'open',
      approvalRequestId: null,
      createdBy: actorUserId,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(SHARED_TASKS_COL(organizationId)).doc(taskId).set(record)
    return record
  }

  async listSharedTasks(organizationId: string, workspaceId?: string): Promise<SharedTaskRecord[]> {
    let query = this.db.collection(SHARED_TASKS_COL(organizationId)).orderBy('createdAt', 'desc') as admin.firestore.Query
    if (workspaceId) {
      query = this.db.collection(SHARED_TASKS_COL(organizationId)).where('workspaceId', '==', workspaceId)
    }
    const snap = await query.get()
    return snap.docs.map((d) => d.data() as SharedTaskRecord)
  }

  async setTaskStatus(organizationId: string, taskId: string, status: SharedTaskRecord['status']): Promise<SharedTaskRecord | null> {
    const ref = this.db.collection(SHARED_TASKS_COL(organizationId)).doc(taskId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ status, updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as SharedTaskRecord
  }

  // ── Shared approvals — the no-bypass path ────────────────────────────────

  /**
   * Requests approval for a shared task via the REAL ApprovalEngine. This
   * method never executes the underlying action and never marks the task
   * completed — it only creates the ApprovalRequest and links its id onto
   * the SharedTaskRecord so callers can later poll getSharedTaskApprovalStatus.
   */
  async requestApprovalForTask(
    organizationId: string,
    actorUserId: string,
    taskId: string,
    input: Omit<CreateApprovalRequestInput, 'createdBy'>
  ): Promise<ApprovalRequest> {
    const taskRef = this.db.collection(SHARED_TASKS_COL(organizationId)).doc(taskId)
    const taskSnap = await taskRef.get()
    if (!taskSnap.exists) throw new Error(`Shared task ${taskId} not found in organization ${organizationId}`)

    const request = await this.approvalEngine.createApprovalRequest(actorUserId, {
      ...input,
      createdBy: actorUserId,
    })

    await taskRef.update({
      approvalRequestId: request.id,
      status: request.status === 'pending' ? 'blocked' : 'open',
      updatedAt: new Date().toISOString(),
    })

    return request
  }

  async getSharedTaskApprovalStatus(organizationId: string, actorUserId: string, taskId: string): Promise<ApprovalRequest | null> {
    const taskSnap = await this.db.collection(SHARED_TASKS_COL(organizationId)).doc(taskId).get()
    if (!taskSnap.exists) return null
    const task = taskSnap.data() as SharedTaskRecord
    if (!task.approvalRequestId) return null
    return this.approvalEngine.getApprovalRequest(actorUserId, task.approvalRequestId)
  }

  async countPendingApprovalsForOrg(organizationId: string, actorUserId: string): Promise<number> {
    const tasksSnap = await this.db
      .collection(SHARED_TASKS_COL(organizationId))
      .where('status', '==', 'blocked')
      .get()
    let pending = 0
    for (const doc of tasksSnap.docs) {
      const task = doc.data() as SharedTaskRecord
      if (!task.approvalRequestId) continue
      const req = await this.approvalEngine.getApprovalRequest(actorUserId, task.approvalRequestId)
      if (req && req.status === 'pending') pending += 1
    }
    return pending
  }
}
