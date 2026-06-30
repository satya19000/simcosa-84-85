import type { ContinuousPlanningEngine, PlanningRunSummary } from './ContinuousPlanningEngine'
import type { FinanceEngine } from '../finance/FinanceEngine'
import type { HealthEngine } from '../health/HealthEngine'
import type { ApprovalEngine } from '../delegation/ApprovalEngine'

/**
 * Naming-convention wrapper so MissionEngine's scheduler surface matches
 * ApprovalEngine.runScheduledChecks / FinanceEngine.runReminderChecks. Does
 * not duplicate ContinuousPlanningEngine's logic — just the entry point a
 * scheduled Cloud Function (or dashboard "Run Planning Cycle" button) calls.
 */
export class MissionScheduler {
  constructor(private readonly planningEngine: ContinuousPlanningEngine) {}

  async runAllChecks(
    userId: string,
    connected: { finance?: FinanceEngine; health?: HealthEngine; approvals?: ApprovalEngine } = {}
  ): Promise<PlanningRunSummary> {
    return this.planningEngine.runCycle(userId, connected)
  }
}
