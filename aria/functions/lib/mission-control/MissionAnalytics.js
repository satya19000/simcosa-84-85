"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionAnalytics = void 0;
const ALL_STATUSES = ['draft', 'active', 'paused', 'completed', 'abandoned'];
const ALL_DOMAINS = ['finance', 'health', 'delegation', 'communication', 'general'];
class MissionAnalytics {
    constructor(missions) {
        this.missions = missions;
    }
    async getStats(userId) {
        const all = await this.missions.listMissions(userId);
        const byStatus = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0]));
        const byDomain = Object.fromEntries(ALL_DOMAINS.map((d) => [d, 0]));
        let progressSum = 0;
        let completedThisMonth = 0;
        let overdue = 0;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        for (const m of all) {
            byStatus[m.status]++;
            byDomain[m.domain]++;
            progressSum += m.progress;
            if (m.status === 'completed' && m.completedAt && m.completedAt >= monthStart)
                completedThisMonth++;
            if (m.targetDate && m.status !== 'completed' && m.status !== 'abandoned' && m.targetDate < now.toISOString())
                overdue++;
        }
        return {
            totalMissions: all.length,
            byStatus,
            byDomain,
            avgProgress: all.length ? Math.round(progressSum / all.length) : 0,
            completedThisMonth,
            overdue,
        };
    }
    /** Helper used by PredictionEngine: missions with a targetDate within `windowDays` that aren't done. */
    async listAtRiskMissions(userId, windowDays) {
        const all = await this.missions.listMissions(userId, { status: 'active' });
        const cutoff = new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000).toISOString();
        return all.filter((m) => m.targetDate && m.targetDate <= cutoff && m.progress < 100);
    }
}
exports.MissionAnalytics = MissionAnalytics;
//# sourceMappingURL=MissionAnalytics.js.map