import type { ApprovalConfig } from './ApprovalConfig'
import type { ApprovalLevel, ApprovalTriggerType } from './ApprovalTypes'

// Trigger types that must ALWAYS go through human approval, regardless of how
// low the computed risk score is (e.g. an AI that is 99% confident a payment
// is fine still doesn't get to skip approval for an actual money movement).
const ALWAYS_MANUAL_TRIGGERS: ApprovalTriggerType[] = [
  'financial_payment', 'medical_decision', 'health_record_update', 'plugin_installation',
]

export class ApprovalPolicy {
  constructor(private readonly config: ApprovalConfig) {}

  /** Maps a 0-100 risk score onto the required ApprovalLevel band. */
  determineApprovalLevel(riskScore: number): ApprovalLevel {
    if (riskScore < this.config.autoExecuteThreshold) return 'simple'
    if (riskScore < this.config.simpleThreshold) return 'standard'
    if (riskScore < this.config.executiveThreshold) return 'executive'
    return 'emergency'
  }

  /**
   * True only when the risk score is below the auto-execute threshold AND the
   * triggerType is not in the always-manual list. Auto-execution eligibility
   * still requires status to genuinely reach 'approved' via ApprovalEngine —
   * this method only decides whether ApprovalEngine.createApprovalRequest is
   * ALLOWED to skip the human wait, never whether it executes outright.
   */
  requiresApproval(riskScore: number, triggerType: ApprovalTriggerType): boolean {
    if (ALWAYS_MANUAL_TRIGGERS.includes(triggerType)) return true
    return riskScore >= this.config.autoExecuteThreshold
  }

  isAutoExecuteEligible(riskScore: number, triggerType: ApprovalTriggerType): boolean {
    return !this.requiresApproval(riskScore, triggerType)
  }

  getBands(): { autoExecuteThreshold: number; simpleThreshold: number; executiveThreshold: number; alwaysManualTriggers: ApprovalTriggerType[] } {
    return {
      autoExecuteThreshold: this.config.autoExecuteThreshold,
      simpleThreshold: this.config.simpleThreshold,
      executiveThreshold: this.config.executiveThreshold,
      alwaysManualTriggers: ALWAYS_MANUAL_TRIGGERS,
    }
  }
}
