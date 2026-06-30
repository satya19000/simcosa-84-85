"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionScheduler = void 0;
/**
 * Naming-convention wrapper so MissionEngine's scheduler surface matches
 * ApprovalEngine.runScheduledChecks / FinanceEngine.runReminderChecks. Does
 * not duplicate ContinuousPlanningEngine's logic — just the entry point a
 * scheduled Cloud Function (or dashboard "Run Planning Cycle" button) calls.
 */
class MissionScheduler {
    constructor(planningEngine) {
        this.planningEngine = planningEngine;
    }
    async runAllChecks(userId, connected = {}) {
        return this.planningEngine.runCycle(userId, connected);
    }
}
exports.MissionScheduler = MissionScheduler;
//# sourceMappingURL=MissionScheduler.js.map