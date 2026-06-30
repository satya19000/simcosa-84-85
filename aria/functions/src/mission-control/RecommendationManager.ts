import type * as admin from 'firebase-admin'
import type { MissionRecommendation, RecommendationStatus, RecommendationSourceDomain } from './MissionTypes'
import { v4 as uuidv4 } from 'uuid'
import { MissionEvents } from './MissionEvents'

/** Firestore repository for MissionRecommendations. */
export class RecommendationManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  private col(userId: string) {
    return this.db.collection('users').doc(userId).collection('missionRecommendations')
  }

  async create(userId: string, fields: Omit<MissionRecommendation, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<MissionRecommendation> {
    const now = new Date().toISOString()
    const rec: MissionRecommendation = { ...fields, id: uuidv4(), userId, status: 'open', createdAt: now, updatedAt: now }
    await this.col(userId).doc(rec.id).set(rec)
    void MissionEvents.emit('recommendation:created', userId, { recommendationId: rec.id, sourceDomain: rec.sourceDomain })
    return rec
  }

  async get(userId: string, id: string): Promise<MissionRecommendation | null> {
    const doc = await this.col(userId).doc(id).get()
    return doc.exists ? (doc.data() as MissionRecommendation) : null
  }

  async list(userId: string, opts: { status?: RecommendationStatus; sourceDomain?: RecommendationSourceDomain; minConfidence?: number } = {}): Promise<MissionRecommendation[]> {
    let query: FirebaseFirestore.Query = this.col(userId)
    if (opts.status) query = query.where('status', '==', opts.status)
    if (opts.sourceDomain) query = query.where('sourceDomain', '==', opts.sourceDomain)
    const snap = await query.orderBy('createdAt', 'desc').limit(200).get()
    let recs = snap.docs.map((d) => d.data() as MissionRecommendation)
    if (opts.minConfidence !== undefined) recs = recs.filter((r) => r.confidence >= opts.minConfidence!)
    return recs
  }

  async setStatus(userId: string, id: string, status: RecommendationStatus, missionId?: string): Promise<MissionRecommendation | null> {
    const ref = this.col(userId).doc(id)
    const doc = await ref.get()
    if (!doc.exists) return null
    const updatedAt = new Date().toISOString()
    const patch: Partial<MissionRecommendation> = { status, updatedAt }
    if (missionId) patch.missionId = missionId
    await ref.update(patch)
    const updated = { ...(doc.data() as MissionRecommendation), ...patch } as MissionRecommendation
    if (status === 'accepted') void MissionEvents.emit('recommendation:accepted', userId, { recommendationId: id })
    if (status === 'dismissed') void MissionEvents.emit('recommendation:dismissed', userId, { recommendationId: id })
    return updated
  }

  /** Idempotency guard: avoid creating duplicate open recommendations for the same sourceRef. */
  async existsOpenForSourceRef(userId: string, sourceRef: string): Promise<boolean> {
    const snap = await this.col(userId).where('sourceRef', '==', sourceRef).where('status', '==', 'open').limit(1).get()
    return !snap.empty
  }

  async expireOlderThan(userId: string, cutoffIso: string): Promise<number> {
    const snap = await this.col(userId).where('status', '==', 'open').where('createdAt', '<', cutoffIso).get()
    let count = 0
    for (const doc of snap.docs) {
      await doc.ref.update({ status: 'expired', updatedAt: new Date().toISOString() })
      count++
    }
    return count
  }
}
