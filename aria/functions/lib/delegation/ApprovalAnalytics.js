"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalAnalytics = void 0;
class ApprovalAnalytics {
    constructor(queue) {
        this.queue = queue;
    }
    async getStats(userId) {
        const all = await this.queue.list(userId, { limit: 1000 });
        const byStatus = {};
        const byLevel = {};
        const byTriggerType = {};
        const riskScoreDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
        const decisionDurations = [];
        const executionDurations = [];
        const delegates = new Set();
        let delegatedCount = 0;
        for (const r of all) {
            byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
            byLevel[r.approvalLevel] = (byLevel[r.approvalLevel] ?? 0) + 1;
            byTriggerType[r.triggerType] = (byTriggerType[r.triggerType] ?? 0) + 1;
            riskScoreDistribution[r.riskLevel] += 1;
            const decisionEntry = r.history.find((h) => h.action === 'approved' || h.action === 'rejected');
            if (decisionEntry) {
                decisionDurations.push(Date.parse(decisionEntry.at) - Date.parse(r.createdAt));
            }
            if (r.executedAt) {
                const approvedEntry = r.history.find((h) => h.action === 'approved');
                if (approvedEntry)
                    executionDurations.push(Date.parse(r.executedAt) - Date.parse(approvedEntry.at));
            }
            if (r.delegatedTo) {
                delegatedCount += 1;
                delegates.add(r.delegatedTo);
            }
        }
        const decidedCount = (byStatus['approved'] ?? 0) + (byStatus['executed'] ?? 0) + (byStatus['rejected'] ?? 0);
        const approvedCount = (byStatus['approved'] ?? 0) + (byStatus['executed'] ?? 0);
        const rejectedCount = byStatus['rejected'] ?? 0;
        const expiredCount = byStatus['expired'] ?? 0;
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
        };
    }
    async countByLevel(userId, level) {
        return (await this.queue.list(userId, { approvalLevel: level, limit: 1000 })).length;
    }
    async countByTrigger(userId, triggerType) {
        return (await this.queue.list(userId, { triggerType, limit: 1000 })).length;
    }
    async countByStatus(userId, status) {
        return (await this.queue.list(userId, { status, limit: 1000 })).length;
    }
    // Exposed for ApprovalMetrics, kept here to avoid duplicating Firestore queries.
    async listAll(userId) {
        return this.queue.list(userId, { limit: 1000 });
    }
}
exports.ApprovalAnalytics = ApprovalAnalytics;
function avg(values) {
    return values.reduce((s, v) => s + v, 0) / values.length;
}
//# sourceMappingURL=ApprovalAnalytics.js.map