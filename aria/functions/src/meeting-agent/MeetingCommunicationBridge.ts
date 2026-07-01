/**
 * MeetingCommunicationBridge.ts — prepares communication drafts for meeting follow-ups.
 *
 * CRITICAL SAFETY INVARIANT:
 * - This class NEVER sends any communication automatically.
 * - Every method returns a DRAFT only.
 * - All outgoing communication MUST go through MeetingApprovalBridge → ApprovalEngine
 *   before being sent.
 * - There is NO code path that sends email, WhatsApp, or SMS from this class.
 */

import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { MeetingFollowUp } from './MeetingTypes'
import type { MeetingApprovalBridge } from './MeetingApprovalBridge'
import type { MeetingSummary } from './MeetingTypes'
import { MeetingLogger } from './MeetingLogger'

const FOLLOW_UPS_COL = (tenantId: string) => `tenants/${tenantId}/meetingFollowUps`

export class MeetingCommunicationBridge {
  private readonly logger = new MeetingLogger()

  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly approvalBridge: MeetingApprovalBridge
  ) {}

  /**
   * Prepare a DRAFT email summary — does NOT send.
   * Returns draft with approvalStatus='draft'.
   * User must approve via approvalBridge before sending.
   */
  async prepareSummaryEmailDraft(input: {
    sessionId: string
    tenantId: string
    userId: string
    summary: MeetingSummary
    recipientName: string
    recipientEmail: string
  }): Promise<MeetingFollowUp> {
    const draftContent = this.buildEmailDraft(input.summary, input.recipientName)
    const followUp = await this.saveDraft({
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      userId: input.userId,
      type: 'emailSummary',
      recipientName: input.recipientName,
      recipientEmail: input.recipientEmail,
      draftContent,
    })
    this.logger.log('follow_up_drafted', input.sessionId, `type=emailSummary`)
    return followUp
  }

  /**
   * Prepare a DRAFT WhatsApp follow-up — does NOT send.
   * Returns draft with approvalStatus='draft'.
   */
  async prepareWhatsAppDraft(input: {
    sessionId: string
    tenantId: string
    userId: string
    summary: MeetingSummary
    recipientName: string
    recipientPhone: string
  }): Promise<MeetingFollowUp> {
    const draftContent = this.buildWhatsAppDraft(input.summary, input.recipientName)
    const followUp = await this.saveDraft({
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      userId: input.userId,
      type: 'whatsappFollowUp',
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      draftContent,
    })
    this.logger.log('follow_up_drafted', input.sessionId, `type=whatsappFollowUp`)
    return followUp
  }

  /**
   * Prepare a DRAFT SMS reminder — does NOT send.
   */
  async prepareSMSDraft(input: {
    sessionId: string
    tenantId: string
    userId: string
    message: string
    recipientName: string
    recipientPhone: string
  }): Promise<MeetingFollowUp> {
    const followUp = await this.saveDraft({
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      userId: input.userId,
      type: 'smsReminder',
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      draftContent: input.message,
    })
    this.logger.log('follow_up_drafted', input.sessionId, `type=smsReminder`)
    return followUp
  }

  /**
   * Prepare a participant follow-up note — does NOT send.
   */
  async prepareParticipantNoteDraft(input: {
    sessionId: string
    tenantId: string
    userId: string
    participantName: string
    noteContent: string
  }): Promise<MeetingFollowUp> {
    const followUp = await this.saveDraft({
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      userId: input.userId,
      type: 'participantNote',
      recipientName: input.participantName,
      draftContent: input.noteContent,
    })
    this.logger.log('follow_up_drafted', input.sessionId, `type=participantNote`)
    return followUp
  }

  /**
   * Request approval for sending a draft follow-up.
   * Routes ONLY through MeetingApprovalBridge → ApprovalEngine.
   * Returns updated followUp with approvalStatus='approvalRequested'.
   */
  async requestSendApproval(
    followUp: MeetingFollowUp,
    userId: string
  ): Promise<MeetingFollowUp> {
    const actionMap: Record<MeetingFollowUp['type'], import('./MeetingApprovalBridge').MeetingApprovalAction> = {
      emailSummary: 'send_meeting_summary_email',
      whatsappFollowUp: 'send_whatsapp_followup',
      smsReminder: 'send_sms_reminder',
      participantNote: 'send_followup_email',
    }

    const approvalRequest = await this.approvalBridge.requestApproval({
      userId,
      tenantId: followUp.tenantId,
      sessionId: followUp.sessionId,
      action: actionMap[followUp.type],
      title: `Send ${followUp.type} to ${followUp.recipientName ?? 'participant'}`,
      summary: `Draft: ${followUp.draftContent.slice(0, 200)}`,
      reason: 'Meeting follow-up communication requires explicit approval before sending.',
      payload: { followUpId: followUp.followUpId },
    })

    const now = new Date().toISOString()
    await this.db
      .collection(FOLLOW_UPS_COL(followUp.tenantId))
      .doc(followUp.followUpId)
      .update({
        approvalStatus: 'approvalRequested',
        approvalRequestId: approvalRequest.id,
        updatedAt: now,
      })

    this.logger.log('approval_requested', followUp.sessionId, `followUpId=${followUp.followUpId}`)
    return {
      ...followUp,
      approvalStatus: 'approvalRequested',
      approvalRequestId: approvalRequest.id,
      updatedAt: now,
    }
  }

  async listFollowUps(tenantId: string, sessionId: string): Promise<MeetingFollowUp[]> {
    const snap = await this.db
      .collection(FOLLOW_UPS_COL(tenantId))
      .where('sessionId', '==', sessionId)
      .orderBy('createdAt', 'desc')
      .get()
    return snap.docs.map((d) => d.data() as MeetingFollowUp)
  }

  private async saveDraft(input: {
    sessionId: string
    tenantId: string
    userId: string
    type: MeetingFollowUp['type']
    recipientName?: string
    recipientEmail?: string
    recipientPhone?: string
    draftContent: string
  }): Promise<MeetingFollowUp> {
    const followUpId = uuidv4()
    const now = new Date().toISOString()
    const followUp: MeetingFollowUp = {
      followUpId,
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      userId: input.userId,
      type: input.type,
      recipientName: input.recipientName,
      recipientEmail: input.recipientEmail,
      recipientPhone: input.recipientPhone,
      draftContent: input.draftContent,
      approvalStatus: 'draft',   // NEVER 'sent' without going through approval
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(FOLLOW_UPS_COL(input.tenantId)).doc(followUpId).set(followUp)
    return followUp
  }

  private buildEmailDraft(summary: MeetingSummary, recipientName: string): string {
    return `Dear ${recipientName},

Thank you for participating in our meeting.

Summary:
${summary.executiveSummary}

Key Decisions:
${summary.decisionsMade.map((d) => `• ${d}`).join('\n') || 'None noted'}

Action Items:
${summary.actionItems.map((a) => `• ${a}`).join('\n') || 'None noted'}

Follow-up Recommendations:
${summary.followUpRecommendations.map((r) => `• ${r}`).join('\n') || 'None noted'}

Best regards`
  }

  private buildWhatsAppDraft(summary: MeetingSummary, recipientName: string): string {
    return `Hi ${recipientName}, here's a quick summary of our meeting:

${summary.shortSummary}

Action items for you: ${summary.actionItems.slice(0, 3).join(', ') || 'None noted'}

Let me know if you have any questions!`
  }
}
