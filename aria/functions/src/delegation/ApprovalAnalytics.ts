import type { ApprovalQueue } from './ApprovalQueue'
import type { ApprovalLevel, ApprovalRequest, ApprovalStatus, ApprovalTriggerType } from './ApprovalTypes'

export interface ApprovalStats {
  total: number
  byStatus: Record<string, number>
  byLevel: Record<string, number>
  byTriggerType: Record<string, number>
  avgTimeToDecisionMs: number | null
  avgTimeToExecutionMs: number | null
  approvalRate: number // approved+executed / (approved+executed+rejected)
  rejectionRate: number
  expiryRate: number
  riskScoreDistribution: { low: number; medium: number; high: number; critical: number }
  delegationStats: { totalDelegated: number; uniqueDelegates: number }
}

export class ApprovalAnalytics {
  constructor(private readonly queue: ApprovalQueue) {}

  async getStats(userId: string): Promise<ApprovalStats> {
    const all = await this.queue.list(userId, { limit: 1000 })

    const byStatus: Record<string, number> = {}
    const byLevel: Record<string, number> = {}
    const byTriggerType: Record<string, number> = {}
    const riskScoreDistribution = { low: 0, medium: 0, high: 0, critical: 0 }
    const decisionDurations: number[] = []
    const executionDurations: number[] = []
    const delegates = new Set<string>()
    let delegatedCount = 0

    for (const r of all) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
      byLevel[r.approvalLevel] = (byLevel[r.approvalLevel] ?? 0) + 1
      byTriggerType[r.triggerType] = (byTriggerType[r.triggerType] ?? 0) + 1
      riskScoreDistribution[r.riskLevel] += 1

      const decisionEntry = r.history.find((h) => h.action === 'approved' || h.action === 'rejected')
      if (decisionEntry) {
        decisionDurations.push(Date.parse(decisionEntry.at) - Date.parse(r.createdAt))
      }
      if (r.executedAt) {
        const approvedEntry = r.history.find((h) => h.action === 'approved')
        if (approvedEntry) executionDurations.push(Date.parse(r.executedAt) - Date.parse(approvedEntry.at))
      }
      if (r.delegatedTo) {
        delegatedCount += 1
        delegates.add(r.delegatedTo)
      }
    }

    const decidedCount = (byStatus['approved'] ?? 0) + (byStatus['executed'] ?? 0) + (byStatus['rejected'] ?? 0)
    const approvedCount = (byStatus['approved'] ?? 0) + (byStatus['executed'] ?? 0)
    const rejectedCount = byStatus['rejected'] ?? 0
    const expiredCount = byStatus['expired'] ?? 0

    return {
      total: all.length,
      byStatus,
      byLevel,
      byTriggerType,
      avgTimeToDecisionMs: decisionDurations.length > 0 ? avg(decisionDurations) : null,
      avgTimeToExecutionMs: executionDurations.length > 0 ? avg(executionDurations) : null,
      approvalRate: decidedCount > 0 ? approvedCount / decidedCount : 0,
      rejectionRate: decidedCount > 0 ? rejectedCount / decidedCount : 0,
      expiryRate: all.length > 0 ? expiredCount / all.length : 0,
      riskScoreDistribution,
      delegationStats: { totalDelegated: delegatedCount, uniqueDelegates: delegates.size },
    }
  }

  async countByLevel(userId: string, level: ApprovalLevel): Promise<number> {
    return (await this.queue.list(userId, { approvalLevel: level, limit: 1000 })).length
  }

  async countByTrigger(userId: string, triggerType: ApprovalTriggerType): Promise<number> {
    return (await this.queue.list(userId, { triggerType, limit: 1000 })).length
  }

  async countByStatus(userId: string, status: ApprovalStatus): Promise<number> {
    return (await this.queue.list(userId, { status, limit: 1000 })).length
  }

  // Exposed for ApprovalMetrics, kept here to avoid duplicating Firestore queries.
  async listAll(userId: string): Promise<ApprovalRequest[]> {
    return this.queue.list(userId, { limit: 1000 })
  }
}

function avg(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length
}
