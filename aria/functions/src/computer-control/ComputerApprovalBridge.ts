import type { ApprovalEngine } from '../delegation/ApprovalEngine'
import type { ApprovalRequest } from '../delegation/ApprovalTypes'
import type { ComputerApprovalInput } from './ComputerTypes'

/**
 * ComputerApprovalBridge — the SINGLE path for all computer-control
 * approval requests.
 *
 * CRITICAL SAFETY INVARIANT:
 * - All medium/high/critical computer actions MUST go through this bridge.
 * - This class calls ONLY the real ApprovalEngine.createApprovalRequest —
 *   no parallel approval mechanism, no internal approval state, no "auto-
 *   approve on behalf of the user" logic.
 * - It mirrors SkillInstaller.ts's approval-bridge pattern exactly.
 * - An action is NEVER executed until its ApprovalRequest reaches status
 *   'approved' through the real ApprovalEngine approval flow.
 *
 * Capabilities that always require approval (deleteFile, sendMessage,
 * submitForm, paymentAction, screenshotWithApproval, readClipboard,
 * pasteFromClipboard, downloadFileWithUserApproval, ocrScreenshot) are
 * all routed through this bridge.
 */
export class ComputerApprovalBridge {
  constructor(private readonly approvalEngine: ApprovalEngine) {}

  /**
   * Request approval via the real ApprovalEngine.createApprovalRequest.
   * Returns the created ApprovalRequest — callers must check request.status
   * before proceeding. If status is not 'approved', execution must be blocked.
   */
  async requestApproval(input: ComputerApprovalInput): Promise<ApprovalRequest> {
    const riskFactors = this.buildRiskFactors(input)

    // Route to real ApprovalEngine — no invented parallel mechanism.
    const request = await this.approvalEngine.createApprovalRequest(
      input.userId,
      {
        title: `Computer Action: ${input.capabilityId}`,
        summary: input.description,
        reason: input.reason,
        // Map to nearest ApprovalTriggerType — external_api_call covers network/form/message;
        // send_email covers sendMessage; delete_documents covers deleteFile.
        triggerType: this.mapTriggerType(input.capabilityId),
        actions: [
          {
            id: `${input.planId}-step-${input.stepIndex}`,
            description: input.description,
            target: input.capabilityId,
            payload: input.parameters ?? {},
          },
        ],
        rollbackPlan: input.irreversible
          ? 'Action is irreversible — no automated rollback available. Manual remediation required.'
          : `Reverse the "${input.capabilityId}" operation if the result is unwanted.`,
        riskFactors,
        createdBy: input.userId,
      }
    )

    return request
  }

  /**
   * Verify that an existing approval request is genuinely in 'approved' status
   * before permitting execution. This is the execution gate.
   */
  async getApprovalStatus(userId: string, approvalRequestId: string): Promise<ApprovalRequest | null> {
    return this.approvalEngine.getApprovalRequest(userId, approvalRequestId)
  }

  /**
   * Map a computer capability to the closest ApprovalTriggerType.
   * These are existing types from ApprovalTypes.ts — never invented.
   */
  private mapTriggerType(
    capabilityId: string
  ): 'send_email' | 'delete_documents' | 'financial_payment' | 'external_api_call' | 'bulk_operation' {
    switch (capabilityId) {
      case 'sendMessage':
        return 'send_email'
      case 'deleteFile':
        return 'delete_documents'
      case 'paymentAction':
        return 'financial_payment'
      case 'submitForm':
      case 'downloadFileWithUserApproval':
      case 'screenshotWithApproval':
      case 'ocrScreenshot':
      case 'readClipboard':
      case 'pasteFromClipboard':
        return 'external_api_call'
      default:
        return 'bulk_operation'
    }
  }

  private buildRiskFactors(input: ComputerApprovalInput) {
    return {
      externalCommunication: input.capabilityId === 'sendMessage' || input.capabilityId === 'submitForm',
      financialImpact: input.capabilityId === 'paymentAction' ? 1.0 : 0,
      healthImpact: false,
      privacyImpact: ['screenshotWithApproval', 'ocrScreenshot', 'readClipboard', 'pasteFromClipboard'].includes(input.capabilityId),
      irreversible: input.irreversible,
      aiConfidence: input.riskLevel === 'low' ? 0.9 : input.riskLevel === 'medium' ? 0.7 : 0.4,
    }
  }
}
