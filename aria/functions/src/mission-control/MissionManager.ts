import type * as admin from 'firebase-admin'
import type { Mission, MissionDomain, MissionPriority, MissionStatus } from './MissionTypes'
import { v4 as uuidv4 } from 'uuid'
import { MissionEvents } from './MissionEvents'

/** Firestore repository for Missions. Never executes risky actions — pure CRUD + progress bookkeeping. */
export class MissionManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  private col(userId: string) {
    return this.db.collection('users').doc(userId).collection('missions')
  }

  async createMission(
    userId: string,
    fields: Omit<Mission, 'id' | 'userId' | 'status' | 'progress' | 'createdAt' | 'updatedAt'>
  ): Promise<Mission> {
    const now = new Date().toISOString()
    const mission: Mission = {
      ...fields,
      id: uuidv4(),
      userId,
      status: 'draft',
      progress: 0,
      createdAt: now,
      updatedAt: now,
    }
    await this.col(userId).doc(mission.id).set(mission)
    void MissionEvents.emit('mission:created', userId, { missionId: mission.id })
    return mission
  }

  async getMission(userId: string, missionId: string): Promise<Mission | null> {
    const doc = await this.col(userId).doc(missionId).get()
    return doc.exists ? (doc.data() as Mission) : null
  }

  async listMissions(userId: string, opts: { status?: MissionStatus; domain?: MissionDomain; priority?: MissionPriority } = {}): Promise<Mission[]> {
    let query: FirebaseFirestore.Query = this.col(userId)
    if (opts.status) query = query.where('status', '==', opts.status)
    if (opts.domain) query = query.where('domain', '==', opts.domain)
    if (opts.priority) query = query.where('priority', '==', opts.priority)
    const snap = await query.orderBy('createdAt', 'desc').limit(200).get()
    return snap.docs.map((d) => d.data() as Mission)
  }

  async updateMission(userId: string, missionId: string, fields: Partial<Pick<Mission, 'title' | 'description' | 'priority' | 'targetDate' | 'status'>>): Promise<Mission | null> {
    const ref = this.col(userId).doc(missionId)
    const doc = await ref.get()
    if (!doc.exists) return null
    const updatedAt = new Date().toISOString()
    await ref.update({ ...fields, updatedAt })
    const updated = { ...(doc.data() as Mission), ...fields, updatedAt }
    void MissionEvents.emit('mission:updated', userId, { missionId })
    return updated
  }

  async setProgress(userId: string, missionId: string, progress: number): Promise<Mission | null> {
    const ref = this.col(userId).doc(missionId)
    const doc = await ref.get()
    if (!doc.exists) return null
    const updatedAt = new Date().toISOString()
    const clamped = Math.max(0, Math.min(100, progress))
    const patch: Partial<Mission> = { progress: clamped, updatedAt }
    if (clamped >= 100) {
      patch.status = 'completed'
      patch.completedAt = updatedAt
    }
    await ref.update(patch)
    const updated = { ...(doc.data() as Mission), ...patch } as Mission
    if (clamped >= 100) void MissionEvents.emit('mission:completed', userId, { missionId })
    return updated
  }

  async setMemoryNodeId(userId: string, missionId: string, memoryNodeId: string): Promise<void> {
    await this.col(userId).doc(missionId).update({ memoryNodeId })
  }

  async abandonMission(userId: string, missionId: string, reason?: string): Promise<Mission | null> {
    const ref = this.col(userId).doc(missionId)
    const doc = await ref.get()
    if (!doc.exists) return null
    const updatedAt = new Date().toISOString()
    await ref.update({ status: 'abandoned', updatedAt })
    void MissionEvents.emit('mission:abandoned', userId, { missionId, reason })
    return { ...(doc.data() as Mission), status: 'abandoned', updatedAt }
  }

  async deleteMission(userId: string, missionId: string): Promise<void> {
    await this.col(userId).doc(missionId).delete()
  }
}
