import type * as admin from 'firebase-admin'
import type { LearningSnapshot, RecommendationOutcome, RecommendationSourceDomain } from './MissionTypes'
import type { MissionConfig } from './MissionConfig'
import { v4 as uuidv4 } from 'uuid'

/**
 * Heuristic learning loop: every accept/dismiss on a MissionRecommendation
 * is logged as a RecommendationOutcome, and a per-domain acceptance rate is
 * used to scale future recommendation confidence up or down. This is
 * intentionally simple counting statistics — NOT a trained model. A real
 * ML-based scorer is a reasonable Phase 5.1 addition (see README).
 */
export class LearningEngine {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly config: MissionConfig
  ) {}

  private col(userId: string) {
    return this.db.collection('users').doc(userId).collection('missionRecommendationOutcomes')
  }

  async recordOutcome(userId: string, recommendationId: string, sourceDomain: RecommendationSourceDomain, accepted: boolean): Promise<RecommendationOutcome> {
    const outcome: RecommendationOutcome = {
      id: uuidv4(),
      userId,
      recommendationId,
      sourceDomain,
      accepted,
      recordedAt: new Date().toISOString(),
    }
    await this.col(userId).doc(outcome.id).set(outcome)
    return outcome
  }

  async getSnapshot(userId: string, sourceDomain: RecommendationSourceDomain): Promise<LearningSnapshot> {
    const snap = await this.col(userId).where('sourceDomain', '==', sourceDomain).get()
    const outcomes = snap.docs.map((d) => d.data() as RecommendationOutcome)
    const totalShown = outcomes.length
    const totalAccepted = outcomes.filter((o) => o.accepted).length
    const acceptanceRate = totalShown > 0 ? totalAccepted / totalShown : 0.5 // neutral prior with no data
    return {
      sourceDomain,
      totalShown,
      totalAccepted,
      acceptanceRate,
      confidenceAdjustment: this.rateToAdjustment(acceptanceRate, totalShown),
    }
  }

  async getAllSnapshots(userId: string): Promise<LearningSnapshot[]> {
    const domains: RecommendationSourceDomain[] = ['finance', 'health', 'delegation', 'communication', 'general']
    return Promise.all(domains.map((d) => this.getSnapshot(userId, d)))
  }

  /** Multiplier applied by RecommendationEngine when scoring new recommendations from this domain. */
  async getConfidenceAdjustment(userId: string, sourceDomain: RecommendationSourceDomain): Promise<number> {
    const snapshot = await this.getSnapshot(userId, sourceDomain)
    return snapshot.confidenceAdjustment
  }

  // Maps acceptance rate (0-1) onto a bounded multiplier. With too few
  // samples (<5), stays neutral (1.0) to avoid over-reacting to noise.
  private rateToAdjustment(rate: number, sampleSize: number): number {
    if (sampleSize < 5) return 1.0
    const raw = 0.5 + rate // rate 0 -> 0.5, rate 1 -> 1.5
    return Math.max(this.config.minConfidenceAdjustment, Math.min(this.config.maxConfidenceAdjustment, raw))
  }
}
