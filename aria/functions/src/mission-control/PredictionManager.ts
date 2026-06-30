import type * as admin from 'firebase-admin'
import type { MissionPrediction, PredictionKind } from './MissionTypes'
import { v4 as uuidv4 } from 'uuid'
import { MissionEvents } from './MissionEvents'

/** Firestore repository for MissionPredictions (append-only log, latest-wins per targetId+kind reads). */
export class PredictionManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  private col(userId: string) {
    return this.db.collection('users').doc(userId).collection('missionPredictions')
  }

  async record(userId: string, fields: Omit<MissionPrediction, 'id' | 'generatedAt'>): Promise<MissionPrediction> {
    const prediction: MissionPrediction = { ...fields, id: uuidv4(), generatedAt: new Date().toISOString() }
    await this.col(userId).doc(prediction.id).set(prediction)
    void MissionEvents.emit('prediction:generated', userId, { predictionId: prediction.id, kind: prediction.kind })
    return prediction
  }

  async latestFor(userId: string, targetId: string, kind: PredictionKind): Promise<MissionPrediction | null> {
    const snap = await this.col(userId)
      .where('targetId', '==', targetId)
      .where('kind', '==', kind)
      .orderBy('generatedAt', 'desc')
      .limit(1)
      .get()
    return snap.empty ? null : (snap.docs[0].data() as MissionPrediction)
  }

  async listForUser(userId: string, kind?: PredictionKind): Promise<MissionPrediction[]> {
    let query: FirebaseFirestore.Query = this.col(userId)
    if (kind) query = query.where('kind', '==', kind)
    const snap = await query.orderBy('generatedAt', 'desc').limit(200).get()
    return snap.docs.map((d) => d.data() as MissionPrediction)
  }
}
