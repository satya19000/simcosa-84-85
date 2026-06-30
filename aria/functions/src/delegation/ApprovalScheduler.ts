import type { ApprovalQueue } from './ApprovalQueue'
import type { ApprovalNotifications } from './ApprovalNotifications'
import type { ApprovalConfig } from './ApprovalConfig'

/**
 * Like FinanceScheduler: generates expiring-soon notifications and transitions
 * truly-overdue requests to 'expired'. Never auto-acts on a pending request's
 * underlying triggerType — expiry just means the approval window lapsed, the
 * action itself is never executed.
 */
export class ApprovalScheduler {
  constructor(
    private readonly queue: ApprovalQueue,
    private readonly notifications: ApprovalNotifications,
    private readonly config: ApprovalConfig
  ) {}

  async checkExpiringApprovals(userId: string): Promise<number> {
    const urgent = await this.queue.listUrgent(userId, this.config.expiringSoonWindowMs)
    for (const request of urgent) {
      await this.notifications.notifyApprovalExpiring(request)
    }
    return urgent.length
  }

  async expireOverdueApprovals(userId: string): Promise<number> {
    const pending = await this.queue.listPending(userId)
    const now = Date.now()
    const overdue = pending.filter((r) => Date.parse(r.expiresAt) <= now)
    for (const request of overdue) {
      await this.queue.markExpired(userId, request.id)
    }
    return overdue.length
  }

  async runAllChecks(userId: string): Promise<{ expiringNotified: number; expired: number }> {
    const [expiringNotified, expired] = await Promise.all([
      this.checkExpiringApprovals(userId),
      this.expireOverdueApprovals(userId),
    ])
    return { expiringNotified, expired }
  }
}
