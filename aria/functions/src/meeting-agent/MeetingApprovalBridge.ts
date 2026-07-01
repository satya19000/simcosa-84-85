/**
 * MeetingApprovalBridge.ts — the SINGLE path for all meeting-related approvals.
 *
 * CRITICAL SAFETY INVARIANT:
 * - All approval requests for meeting actions MUST go through this bridge.
 * - This class calls ONLY the real ApprovalEngine.createApprovalRequest.
 * - There is NO parallel approval mechanism, NO internal approval state,
 *   NO "auto-approve on behalf of the user" logic.
 * - No communication (email, WhatsApp, SMS) is sent without going through here.
 * - No task/reminder is created without going through here.
 * - No transcript is shared without going through here.
 * - This mirrors ComputerApprovalBridge exactly.
 */

import type { ApprovalEngine } from '../delegation/ApprovalEngine'
import type { ApprovalRequest } from '../delegation/ApprovalTypes'

export type MeetingApprovalAction =
  | 'send_meeting_summary_email'
  | 'send_followup_email'
  | 'send_whatsapp_followup'
  | 'send_sms_reminder'
  | 'create_task_from_transcript'
  | 'create_reminder_from_transcript'
  | 'share_transcript'
  | 'delete_transcript_with_audit'
  | 'export_meeting_notes'

export interface MeetingApprovalInput {
  userId: string
  tenantId: string
  sessionId: string
  action: MeetingApprovalAction
  title: string
  summary: string
  reason: string
  payload?: Record<string, unknown>
  irreversible?: boolean
}

export class MeetingApprovalBridge {
  constructor(private readonly approvalEngine: ApprovalEngine) {}

  /**
   * Request approval via the real ApprovalEngine.createApprovalRequest.
   *
   * This is the ONLY method that may initiate approval for any meeting action.
   * Returns the created ApprovalRequest. Callers MUST check request.status
   * before proceeding. If status is not 'approved', execution must be blocked.
   *
   * INVARIANT: calls only this.approvalEngine.createApprovalRequest.
   * No parallel mechanism exists.
   */
  async requestApproval(input: MeetingApprovalInput): Promise<ApprovalRequest> {
    const triggerType = this.mapTriggerType(input.action)

    // Route to real ApprovalEngine — no invented parallel mechanism.
    const request = await this.approvalEngine.createApprovalRequest(
      input.userId,
      {
        title: input.title,
        summary: input.summary,
        reason: input.reason,
        triggerType,
        actions: [
          {
            id: `meeting-${input.sessionId}-${input.action}`,
            description: input.summary,
            target: input.action,
            payload: {
              sessionId: input.sessionId,
              tenantId: input.tenantId,
              ...(input.payload ?? {}),
            },
          },
        ],
        rollbackPlan: input.irreversible
          ? 'Action is irreversible — no automated rollback available. Manual remediation required.'
          : `Reverse the "${input.action}" operation if the result is unwanted.`,
        riskFactors: this.buildRiskFactors(input),
        createdBy: input.userId,
      }
    )

    return request
  }

  /**
   * Check the status of an existing approval request.
   */
  async getApprovalStatus(userId: string, approvalRequestId: string): Promise<ApprovalRequest | null> {
    return this.approvalEngine.getApprovalRequest(userId, approvalRequestId)
  }

  /**
   * Map meeting action to the nearest ApprovalTriggerType.
   * Uses only real types from ApprovalTypes.ts.
   */
  private mapTriggerType(
    action: MeetingApprovalAction
  ): 'send_email' | 'send_whatsapp' | 'delete_documents' | 'bulk_operation' | 'external_api_call' {
    switch (action) {
      case 'send_meeting_summary_email':
      case 'send_followup_email':
        return 'send_email'
      case 'send_whatsapp_followup':
        return 'send_whatsapp'
      case 'send_sms_reminder':
        return 'external_api_call'
      case 'delete_transcript_with_audit':
        return 'delete_documents'
      case 'share_transcript':
      case 'export_meeting_notes':
        return 'external_api_call'
      case 'create_task_from_transcript':
      case 'create_reminder_from_transcript':
        return 'bulk_operation'
      default:
        return 'bulk_operation'
    }
  }

  private buildRiskFactors(input: MeetingApprovalInput) {
    const isExternalComm = [
      'send_meeting_summary_email',
      'send_followup_email',
      'send_whatsapp_followup',
      'send_sms_reminder',
    ].includes(input.action)

    return {
      externalCommunication: isExternalComm,
      financialImpact: 0,
      healthImpact: false,
      privacyImpact: ['share_transcript', 'export_meeting_notes', 'delete_transcript_with_audit'].includes(input.action),
      irreversible: input.irreversible ?? false,
      aiConfidence: 0.8,
    }
  }
}
