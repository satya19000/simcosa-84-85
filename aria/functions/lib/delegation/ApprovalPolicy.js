"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalPolicy = void 0;
// Trigger types that must ALWAYS go through human approval, regardless of how
// low the computed risk score is (e.g. an AI that is 99% confident a payment
// is fine still doesn't get to skip approval for an actual money movement).
const ALWAYS_MANUAL_TRIGGERS = [
    'financial_payment', 'medical_decision', 'health_record_update', 'plugin_installation',
];
class ApprovalPolicy {
    constructor(config) {
        this.config = config;
    }
    /** Maps a 0-100 risk score onto the required ApprovalLevel band. */
    determineApprovalLevel(riskScore) {
        if (riskScore < this.config.autoExecuteThreshold)
            return 'simple';
        if (riskScore < this.config.simpleThreshold)
            return 'standard';
        if (riskScore < this.config.executiveThreshold)
            return 'executive';
        return 'emergency';
    }
    /**
     * True only when the risk score is below the auto-execute threshold AND the
     * triggerType is not in the always-manual list. Auto-execution eligibility
     * still requires status to genuinely reach 'approved' via ApprovalEngine —
     * this method only decides whether ApprovalEngine.createApprovalRequest is
     * ALLOWED to skip the human wait, never whether it executes outright.
     */
    requiresApproval(riskScore, triggerType) {
        if (ALWAYS_MANUAL_TRIGGERS.includes(triggerType))
            return true;
        return riskScore >= this.config.autoExecuteThreshold;
    }
    isAutoExecuteEligible(riskScore, triggerType) {
        return !this.requiresApproval(riskScore, triggerType);
    }
    getBands() {
        return {
            autoExecuteThreshold: this.config.autoExecuteThreshold,
            simpleThreshold: this.config.simpleThreshold,
            executiveThreshold: this.config.executiveThreshold,
            alwaysManualTriggers: ALWAYS_MANUAL_TRIGGERS,
        };
    }
}
exports.ApprovalPolicy = ApprovalPolicy;
//# sourceMappingURL=ApprovalPolicy.js.map