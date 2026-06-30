import type * as admin from 'firebase-admin'
import type { MissionTask, MissionTaskStatus } from './MissionTypes'
import { v4 as uuidv4 } from 'uuid'
import { MissionEvents } from './MissionEvents'

/** Firestore repository for MissionTasks, scoped under each mission. */
export class MissionTaskManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  private col(userId: string) {
    return this.db.collection('users').doc(userId).collection('missionTasks')
  }

  async createTask(
    userId: string,
    fields: Omit<MissionTask, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<MissionTask> {
    const now = new Date().toISOString()
    const task: MissionTask = {
      ...fields,
      id: uuidv4(),
      userId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }
    await this.col(userId).doc(task.id).set(task)
    void MissionEvents.emit('task:created', userId, { taskId: task.id, missionId: task.missionId })
    return task
  }

  async getTask(userId: string, taskId: string): Promise<MissionTask | null> {
    const doc = await this.col(userId).doc(taskId).get()
    return doc.exists ? (doc.data() as MissionTask) : null
  }

  async listTasksForMission(userId: string, missionId: string): Promise<MissionTask[]> {
    const snap = await this.col(userId).where('missionId', '==', missionId).orderBy('order', 'asc').get()
    return snap.docs.map((d) => d.data() as MissionTask)
  }

  async listAllTasks(userId: string, opts: { status?: MissionTaskStatus } = {}): Promise<MissionTask[]> {
    let query: FirebaseFirestore.Query = this.col(userId)
    if (opts.status) query = query.where('status', '==', opts.status)
    const snap = await query.orderBy('createdAt', 'desc').limit(200).get()
    return snap.docs.map((d) => d.data() as MissionTask)
  }

  async setStatus(userId: string, taskId: string, status: MissionTaskStatus): Promise<MissionTask | null> {
    const ref = this.col(userId).doc(taskId)
    const doc = await ref.get()
    if (!doc.exists) return null
    const updatedAt = new Date().toISOString()
    const patch: Partial<MissionTask> = { status, updatedAt }
    if (status === 'completed') patch.completedAt = updatedAt
    await ref.update(patch)
    const updated = { ...(doc.data() as MissionTask), ...patch } as MissionTask
    if (status === 'completed') void MissionEvents.emit('task:completed', userId, { taskId, missionId: updated.missionId })
    if (status === 'blocked') void MissionEvents.emit('task:blocked', userId, { taskId, missionId: updated.missionId })
    return updated
  }

  async linkApprovalRequest(userId: string, taskId: string, approvalRequestId: string): Promise<void> {
    await this.col(userId).doc(taskId).update({ approvalRequestId, updatedAt: new Date().toISOString() })
  }

  /** Are this task's declared dependencies all completed? Used to gate execution. */
  async dependenciesSatisfied(userId: string, task: MissionTask): Promise<boolean> {
    if (task.dependsOn.length === 0) return true
    const deps = await Promise.all(task.dependsOn.map((id) => this.getTask(userId, id)))
    return deps.every((d) => d?.status === 'completed')
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    await this.col(userId).doc(taskId).delete()
  }

  async deleteTasksForMission(userId: string, missionId: string): Promise<void> {
    const tasks = await this.listTasksForMission(userId, missionId)
    await Promise.all(tasks.map((t) => this.deleteTask(userId, t.id)))
  }
}
