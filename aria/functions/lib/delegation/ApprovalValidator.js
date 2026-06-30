"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalValidator = void 0;
class ApprovalValidator {
    validateApprovalRequest(request) {
        const errors = [];
        const warnings = [];
        if (!request.userId)
            errors.push('userId is required');
        if (!request.title)
            errors.push('title is required');
        if (!request.summary)
            errors.push('summary is required');
        if (!request.reason)
            errors.push('reason is required');
        if (!request.triggerType)
            errors.push('triggerType is required');
        if (request.riskScore === undefined || request.riskScore < 0 || request.riskScore > 100) {
            errors.push('riskScore must be between 0 and 100');
        }
        if (request.aiConfidence === undefined || request.aiConfidence < 0 || request.aiConfidence > 1) {
            errors.push('aiConfidence must be between 0 and 1');
        }
        if (!request.actions || request.actions.length === 0)
            errors.push('at least one action is required');
        if (!request.rollbackPlan)
            warnings.push('No rollback plan specified — irreversible actions should always define one');
        if (!request.expiresAt || isNaN(Date.parse(request.expiresAt)))
            errors.push('expiresAt must be a valid date');
        if (request.aiConfidence !== undefined && request.aiConfidence < 0.5) {
            warnings.push('Low AI confidence — recommend manual review regardless of risk score');
        }
        return { valid: errors.length === 0, errors, warnings };
    }
    validateDelegationRule(rule) {
        const errors = [];
        const warnings = [];
        if (!rule.userId)
            errors.push('userId is required');
        if (!rule.fromUserId)
            errors.push('fromUserId is required');
        if (!rule.toUserId)
            errors.push('toUserId is required');
        if (rule.fromUserId && rule.toUserId && rule.fromUserId === rule.toUserId) {
            errors.push('fromUserId and toUserId must differ');
        }
        if (!rule.scopeTriggerTypes || rule.scopeTriggerTypes.length === 0) {
            warnings.push('No triggerType scope specified — rule will not match any approval');
        }
        if (!rule.maxApprovalLevel)
            errors.push('maxApprovalLevel is required');
        if (rule.expiresAt && isNaN(Date.parse(rule.expiresAt)))
            errors.push('expiresAt must be a valid date');
        return { valid: errors.length === 0, errors, warnings };
    }
}
exports.ApprovalValidator = ApprovalValidator;
//# sourceMappingURL=ApprovalValidator.js.map