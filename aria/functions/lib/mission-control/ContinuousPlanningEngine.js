"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContinuousPlanningEngine = void 0;
/**
 * Scheduler-equivalent for Mission Control: a single entry point a caller
 * (e.g. a scheduled Cloud Function, or a manual "Run Planning" button on the
 * dashboard) invokes to refresh recommendations from each connected domain
 * engine, regenerate predictions for active missions, and expire stale
 * recommendations. Mirrors ApprovalScheduler.runAllChecks /
 * FinanceScheduler.runAllChecks. Never executes anything risky itself —
 * read/derive/persist only.
 */
class ContinuousPlanningEngine {
    constructor(missions, recommendations, recommendationEngine, predictionEngine, config) {
        this.missions = missions;
        this.recommendations = recommendations;
        this.recommendationEngine = recommendationEngine;
        this.predictionEngine = predictionEngine;
        this.config = config;
    }
    async runCycle(userId, connected) {
        let recommendationsCreated = 0;
        if (connected.finance) {
            const created = await this.recommendationEngine.refreshFromFinance(userId, connected.finance);
            recommendationsCreated += created.length;
        }
        if (connected.health) {
            const created = await this.recommendationEngine.refreshFromHealth(userId, connected.health);
            recommendationsCreated += created.length;
        }
        if (connected.approvals) {
            const created = await this.recommendationEngine.refreshFromDelegation(userId, connected.approvals);
            recommendationsCreated += created.length;
        }
        const cutoff = new Date(Date.now() - this.config.recommendationExpiryMs).toISOString();
        const recommendationsExpired = await this.recommendations.expireOlderThan(userId, cutoff);
        const activeMissions = await this.missions.listMissions(userId, { status: 'active' });
        let predictionsGenerated = 0;
        for (const mission of activeMissions) {
            const generated = await this.predictionEngine.refreshAll(userId, mission);
            predictionsGenerated += generated.length;
        }
        return {
            recommendationsCreated,
            predictionsGenerated,
            recommendationsExpired,
            ranAt: new Date().toISOString(),
        };
    }
}
exports.ContinuousPlanningEngine = ContinuousPlanningEngine;
//# sourceMappingURL=ContinuousPlanningEngine.js.map