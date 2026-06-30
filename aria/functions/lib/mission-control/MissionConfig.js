"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MISSION_CONFIG = void 0;
// Risk bands mirror ApprovalPolicy's spirit but operate over MissionRiskLevel,
// not riskScore — Mission Control never invents its own approval math, it
// always defers the actual go/no-go decision to ApprovalPolicy/ApprovalEngine
// once a step requires approval (see MissionPolicies.ts).
exports.DEFAULT_MISSION_CONFIG = {
    planningHorizonDays: 7,
    approvalRequiredForRiskLevel: {
        low: false,
        medium: false,
        high: true,
        critical: true,
        emergency: true,
    },
    schedulerCheckIntervalMs: 30 * 60 * 1000, // 30 minutes
    maxQueueSize: 200,
    recommendationExpiryMs: 48 * 60 * 60 * 1000, // 48 hours
    defaultDeadlineLookaheadMs: 24 * 60 * 60 * 1000, // 24 hours
    minRecommendationConfidence: 0.4,
    minConfidenceAdjustment: 0.5,
    maxConfidenceAdjustment: 1.5,
    atRiskWindowDays: 7,
};
//# sourceMappingURL=MissionConfig.js.map