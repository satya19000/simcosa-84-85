"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalRequestBuilder = void 0;
exports.computeRiskScore = computeRiskScore;
exports.riskScoreToLevel = riskScoreToLevel;
exports.buildApprovalRequest = buildApprovalRequest;
const uuid_1 = require("uuid");
/** Computes a 0-100 risk score from weighted RiskFactors. */
function computeRiskScore(factors) {
    let score = 0;
    if (factors.externalCommunication)
        score += 20;
    score += Math.max(0, Math.min(1, factors.financialImpact)) * 30;
    if (factors.healthImpact)
        score += 25;
    if (factors.privacyImpact)
        score += 15;
    if (factors.irreversible)
        score += 20;
    // Low AI confidence increases risk — confidence 1.0 contributes 0, confidence 0 contributes 15.
    score += (1 - Math.max(0, Math.min(1, factors.aiConfidence))) * 15;
    return Math.max(0, Math.min(100, Math.round(score)));
}
function riskScoreToLevel(score) {
    if (score >= 80)
        return 'critical';
    if (score >= 50)
        return 'high';
    if (score >= 20)
        return 'medium';
    return 'low';
}
/** Factory building a well-formed ApprovalRequest with a computed risk score. */
function buildApprovalRequest(input, config) {
    const now = new Date();
    const riskScore = computeRiskScore(input.riskFactors);
    const expiresAt = new Date(now.getTime() + (input.expiresInMs ?? config.defaultExpiryMs)).toISOString();
    return {
        id: (0, uuid_1.v4)(),
        userId: input.userId,
        title: input.title,
        summary: input.summary,
        reason: input.reason,
        riskLevel: riskScoreToLevel(riskScore),
        riskScore,
        aiConfidence: input.riskFactors.aiConfidence,
        workflowId: input.workflowId,
        actions: input.actions,
        rollbackPlan: input.rollbackPlan,
        estimatedDurationMs: input.estimatedDurationMs,
        createdBy: input.createdBy,
        createdAt: now.toISOString(),
        expiresAt,
        status: input.status ?? 'pending',
        triggerType: input.triggerType,
        approvalLevel: input.approvalLevel,
        history: [
            {
                id: (0, uuid_1.v4)(),
                action: 'created',
                actor: input.createdBy,
                at: now.toISOString(),
            },
        ],
        updatedAt: now.toISOString(),
    };
}
/** Small builder class alternative to the factory function, for fluent construction. */
class ApprovalRequestBuilder {
    constructor() {
        this.input = {};
    }
    withUser(userId, createdBy) {
        this.input.userId = userId;
        this.input.createdBy = createdBy;
        return this;
    }
    withContent(title, summary, reason) {
        this.input.title = title;
        this.input.summary = summary;
        this.input.reason = reason;
        return this;
    }
    withTrigger(triggerType, approvalLevel) {
        this.input.triggerType = triggerType;
        this.input.approvalLevel = approvalLevel;
        return this;
    }
    withActions(actions) {
        this.input.actions = actions;
        return this;
    }
    withRollback(rollbackPlan, estimatedDurationMs = 0) {
        this.input.rollbackPlan = rollbackPlan;
        this.input.estimatedDurationMs = estimatedDurationMs;
        return this;
    }
    withRiskFactors(riskFactors) {
        this.input.riskFactors = riskFactors;
        return this;
    }
    withWorkflow(workflowId) {
        this.input.workflowId = workflowId;
        return this;
    }
    withStatus(status) {
        this.input.status = status;
        return this;
    }
    withExpiry(expiresInMs) {
        this.input.expiresInMs = expiresInMs;
        return this;
    }
    build(config) {
        const required = ['userId', 'createdBy', 'title', 'summary', 'reason', 'triggerType', 'approvalLevel', 'actions', 'rollbackPlan', 'riskFactors'];
        for (const key of required) {
            if (this.input[key] === undefined)
                throw new Error(`ApprovalRequestBuilder: missing required field "${key}"`);
        }
        return buildApprovalRequest(this.input, config);
    }
}
exports.ApprovalRequestBuilder = ApprovalRequestBuilder;
//# sourceMappingURL=ApprovalRequest.js.map