"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalScheduler = void 0;
/**
 * Like FinanceScheduler: generates expiring-soon notifications and transitions
 * truly-overdue requests to 'expired'. Never auto-acts on a pending request's
 * underlying triggerType — expiry just means the approval window lapsed, the
 * action itself is never executed.
 */
class ApprovalScheduler {
    constructor(queue, notifications, config) {
        this.queue = queue;
        this.notifications = notifications;
        this.config = config;
    }
    async checkExpiringApprovals(userId) {
        const urgent = await this.queue.listUrgent(userId, this.config.expiringSoonWindowMs);
        for (const request of urgent) {
            await this.notifications.notifyApprovalExpiring(request);
        }
        return urgent.length;
    }
    async expireOverdueApprovals(userId) {
        const pending = await this.queue.listPending(userId);
        const now = Date.now();
        const overdue = pending.filter((r) => Date.parse(r.expiresAt) <= now);
        for (const request of overdue) {
            await this.queue.markExpired(userId, request.id);
        }
        return overdue.length;
    }
    async runAllChecks(userId) {
        const [expiringNotified, expired] = await Promise.all([
            this.checkExpiringApprovals(userId),
            this.expireOverdueApprovals(userId),
        ]);
        return { expiringNotified, expired };
    }
}
exports.ApprovalScheduler = ApprovalScheduler;
//# sourceMappingURL=ApprovalScheduler.js.map