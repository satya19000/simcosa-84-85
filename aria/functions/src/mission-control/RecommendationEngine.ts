import type { RecommendationManager } from './RecommendationManager'
import type { MissionRecommendation } from './MissionTypes'
import type { FinanceEngine } from '../finance/FinanceEngine'
import type { HealthEngine } from '../health/HealthEngine'
import type { ApprovalEngine } from '../delegation/ApprovalEngine'
import { LearningEngine } from './LearningEngine'

/**
 * Generates MissionRecommendations by READING existing engines' own
 * suggestion/stat surfaces — it never recomputes Finance/Health business
 * logic itself. This is intentionally a thin aggregator + heuristic scorer,
 * consistent with FinanceScheduler/HealthScheduler's "suggestions" pattern.
 */
export class RecommendationEngine {
  constructor(
    private readonly recommendations: RecommendationManager,
    private readonly learning: LearningEngine
  ) {}

  /** Pull open suggestions from FinanceEngine and mirror unseen ones into MissionRecommendations. */
  async refreshFromFinance(userId: string, finance: FinanceEngine): Promise<MissionRecommendation[]> {
    const suggestions = await finance.listPendingSuggestions(userId)
    const created: MissionRecommendation[] = []
    const adjustment = await this.learning.getConfidenceAdjustment(userId, 'finance')
    for (const s of suggestions) {
      if (await this.recommendations.existsOpenForSourceRef(userId, s.id)) continue
      const baseConfidence = 0.6 // FinanceScheduler suggestions are rule-based, not probabilistic — fixed prior
      const rec = await this.recommendations.create(userId, {
        title: s.title,
        rationale: s.description,
        sourceDomain: 'finance',
        sourceRef: s.id,
        confidence: clamp01(baseConfidence * adjustment),
        impactScore: 50,
      })
      created.push(rec)
    }
    return created
  }

  /** Pull open suggestions from HealthEngine and mirror unseen ones into MissionRecommendations. */
  async refreshFromHealth(userId: string, health: HealthEngine): Promise<MissionRecommendation[]> {
    const suggestions = await health.listPendingSuggestions(userId)
    const created: MissionRecommendation[] = []
    const adjustment = await this.learning.getConfidenceAdjustment(userId, 'health')
    for (const s of suggestions) {
      if (await this.recommendations.existsOpenForSourceRef(userId, s.id)) continue
      const baseConfidence = 0.65
      const rec = await this.recommendations.create(userId, {
        title: s.title,
        rationale: s.description,
        sourceDomain: 'health',
        sourceRef: s.id,
        confidence: clamp01(baseConfidence * adjustment),
        impactScore: 60, // health items weighted slightly higher by default
      })
      created.push(rec)
    }
    return created
  }

  /** Surface urgent/expiring ApprovalRequests as recommendations to act ("decide on this now"). */
  async refreshFromDelegation(userId: string, approvals: ApprovalEngine): Promise<MissionRecommendation[]> {
    const urgent = await approvals.listUrgent(userId)
    const created: MissionRecommendation[] = []
    const adjustment = await this.learning.getConfidenceAdjustment(userId, 'delegation')
    for (const req of urgent) {
      if (await this.recommendations.existsOpenForSourceRef(userId, req.id)) continue
      const rec = await this.recommendations.create(userId, {
        title: `Decide: ${req.title}`,
        rationale: `Approval request expires ${req.expiresAt} (risk ${req.riskScore}/100). Decide before it auto-expires.`,
        sourceDomain: 'delegation',
        sourceRef: req.id,
        confidence: clamp01(0.8 * adjustment), // expiry urgency makes this a high-confidence nudge
        impactScore: Math.min(100, req.riskScore + 10),
      })
      created.push(rec)
    }
    return created
  }

  async listOpen(userId: string, minConfidence?: number): Promise<MissionRecommendation[]> {
    return this.recommendations.list(userId, { status: 'open', minConfidence })
  }

  /** Accept a recommendation into a mission (caller passes the missionId after creating/choosing one). */
  async accept(userId: string, recommendationId: string, missionId: string): Promise<MissionRecommendation | null> {
    const rec = await this.recommendations.setStatus(userId, recommendationId, 'accepted', missionId)
    if (rec) await this.learning.recordOutcome(userId, rec.id, rec.sourceDomain, true)
    return rec
  }

  async dismiss(userId: string, recommendationId: string): Promise<MissionRecommendation | null> {
    const rec = await this.recommendations.setStatus(userId, recommendationId, 'dismissed')
    if (rec) await this.learning.recordOutcome(userId, rec.id, rec.sourceDomain, false)
    return rec
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}
