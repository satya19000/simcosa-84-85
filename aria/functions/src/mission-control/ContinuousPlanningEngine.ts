import type { MissionManager } from './MissionManager'
import type { RecommendationManager } from './RecommendationManager'
import type { RecommendationEngine } from './RecommendationEngine'
import type { PredictionEngine } from './PredictionEngine'
import type { MissionConfig } from './MissionConfig'
import type { FinanceEngine } from '../finance/FinanceEngine'
import type { HealthEngine } from '../health/HealthEngine'
import type { ApprovalEngine } from '../delegation/ApprovalEngine'

export interface PlanningRunSummary {
  recommendationsCreated: number
  predictionsGenerated: number
  recommendationsExpired: number
  ranAt: string
}

/**
 * Scheduler-equivalent for Mission Control: a single entry point a caller
 * (e.g. a scheduled Cloud Function, or a manual "Run Planning" button on the
 * dashboard) invokes to refresh recommendations from each connected domain
 * engine, regenerate predictions for active missions, and expire stale
 * recommendations. Mirrors ApprovalScheduler.runAllChecks /
 * FinanceScheduler.runAllChecks. Never executes anything risky itself —
 * read/derive/persist only.
 */
export class ContinuousPlanningEngine {
  constructor(
    private readonly missions: MissionManager,
    private readonly recommendations: RecommendationManager,
    private readonly recommendationEngine: RecommendationEngine,
    private readonly predictionEngine: PredictionEngine,
    private readonly config: MissionConfig
  ) {}

  async runCycle(
    userId: string,
    connected: { finance?: FinanceEngine; health?: HealthEngine; approvals?: ApprovalEngine }
  ): Promise<PlanningRunSummary> {
    let recommendationsCreated = 0

    if (connected.finance) {
      const created = await this.recommendationEngine.refreshFromFinance(userId, connected.finance)
      recommendationsCreated += created.length
    }
    if (connected.health) {
      const created = await this.recommendationEngine.refreshFromHealth(userId, connected.health)
      recommendationsCreated += created.length
    }
    if (connected.approvals) {
      const created = await this.recommendationEngine.refreshFromDelegation(userId, connected.approvals)
      recommendationsCreated += created.length
    }

    const cutoff = new Date(Date.now() - this.config.recommendationExpiryMs).toISOString()
    const recommendationsExpired = await this.recommendations.expireOlderThan(userId, cutoff)

    const activeMissions = await this.missions.listMissions(userId, { status: 'active' })
    let predictionsGenerated = 0
    for (const mission of activeMissions) {
      const generated = await this.predictionEngine.refreshAll(userId, mission)
      predictionsGenerated += generated.length
    }

    return {
      recommendationsCreated,
      predictionsGenerated,
      recommendationsExpired,
      ranAt: new Date().toISOString(),
    }
  }
}
