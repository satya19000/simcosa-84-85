"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelUsageTracker = void 0;
const uuid_1 = require("uuid");
const USAGE_COL = (tenantId) => `tenants/${tenantId}/aiUsage`;
/**
 * Repository for tenants/{tenantId}/aiUsage/{usageId}. Every AIGateway
 * request — success or failure — writes exactly one usage record here, so
 * getAIUsage / monthly-spend policy checks always have a complete picture.
 */
class ModelUsageTracker {
    constructor(db) {
        this.db = db;
    }
    async record(input) {
        const usageId = (0, uuid_1.v4)();
        const record = {
            id: usageId,
            usageId,
            tenantId: input.tenantId,
            userId: input.userId,
            requestId: input.requestId,
            provider: input.provider,
            model: input.model,
            taskType: input.taskType,
            inputTokens: input.inputTokens,
            outputTokens: input.outputTokens,
            estimatedCostUsd: input.estimatedCostUsd,
            latencyMs: input.latencyMs,
            success: input.success,
            fallbackUsed: input.fallbackUsed,
            timestamp: new Date().toISOString(),
        };
        await this.db.collection(USAGE_COL(input.tenantId)).doc(usageId).set(record);
        return record;
    }
    async listRecent(tenantId, limit = 100) {
        const snap = await this.db
            .collection(USAGE_COL(tenantId))
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map((d) => d.data());
    }
    /** Sum of estimatedCostUsd for usage records timestamped within the current calendar month. */
    async getMonthToDateSpend(tenantId) {
        const startOfMonth = new Date();
        startOfMonth.setUTCDate(1);
        startOfMonth.setUTCHours(0, 0, 0, 0);
        const snap = await this.db
            .collection(USAGE_COL(tenantId))
            .where('timestamp', '>=', startOfMonth.toISOString())
            .get();
        return snap.docs.reduce((sum, d) => sum + (d.data().estimatedCostUsd ?? 0), 0);
    }
}
exports.ModelUsageTracker = ModelUsageTracker;
//# sourceMappingURL=ModelUsageTracker.js.map