import type { ApprovalAnalytics } from './ApprovalAnalytics'

export interface ApprovalMetricsSnapshot {
  totalApprovals: number
  totalPending: number
  totalApproved: number
  totalRejected: number
  totalExpired: number
  totalAutoExecuted: number
  totalExecuted: number
  totalRolledBack: number
  totalDelegated: number
}

/**
 * Lightweight metrics aggregator for the dashboard "Metrics" panel. Counters
 * are tracked in-memory per process for fast incrementing during a request
 * lifecycle, and the authoritative view is always derived fresh from
 * ApprovalAnalytics (Firestore-backed) — this class is a thin combined view,
 * not a second source of truth.
 */
export class ApprovalMetrics {
  private autoExecutedCount = 0

  constructor(private readonly analytics: ApprovalAnalytics) {}

  /** Called by ApprovalEngine whenever a request is auto-executed without a human in the loop. */
  recordAutoExecuted(): void {
    this.autoExecutedCount += 1
  }

  async getSnapshot(userId: string): Promise<ApprovalMetricsSnapshot> {
    const stats = await this.analytics.getStats(userId)
    return {
      totalApprovals: stats.total,
      totalPending: stats.byStatus['pending'] ?? 0,
      totalApproved: stats.byStatus['approved'] ?? 0,
      totalRejected: stats.byStatus['rejected'] ?? 0,
      totalExpired: stats.byStatus['expired'] ?? 0,
      totalAutoExecuted: this.autoExecutedCount,
      totalExecuted: stats.byStatus['executed'] ?? 0,
      totalRolledBack: stats.byStatus['rolled_back'] ?? 0,
      totalDelegated: stats.delegationStats.totalDelegated,
    }
  }
}
