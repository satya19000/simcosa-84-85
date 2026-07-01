/**
 * MeetingFollowUpManager.ts — orchestrates post-meeting follow-up workflows.
 *
 * SAFETY: All outgoing communications go through MeetingCommunicationBridge
 * which routes through MeetingApprovalBridge → ApprovalEngine.
 * Nothing is sent automatically.
 */

import type { MeetingSession, MeetingSummary, MeetingFollowUp } from './MeetingTypes'
import type { MeetingCommunicationBridge } from './MeetingCommunicationBridge'
import { MeetingLogger } from './MeetingLogger'

export interface FollowUpPlan {
  sessionId: string
  emailDrafts: MeetingFollowUp[]
  whatsappDrafts: MeetingFollowUp[]
  participantNotes: MeetingFollowUp[]
  pendingApprovals: number
}

export class MeetingFollowUpManager {
  private readonly logger = new MeetingLogger()

  constructor(private readonly commBridge: MeetingCommunicationBridge) {}

  /**
   * Generate follow-up drafts for all participants who have an email.
   * Returns drafts only — nothing is sent.
   */
  async generateFollowUpDrafts(
    session: MeetingSession,
    summary: MeetingSummary,
    userId: string
  ): Promise<FollowUpPlan> {
    const emailDrafts: MeetingFollowUp[] = []
    const whatsappDrafts: MeetingFollowUp[] = []
    const participantNotes: MeetingFollowUp[] = []

    for (const participant of session.participants) {
      if (participant.email) {
        const draft = await this.commBridge.prepareSummaryEmailDraft({
          sessionId: session.sessionId,
          tenantId: session.tenantId,
          userId,
          summary,
          recipientName: participant.name,
          recipientEmail: participant.email,
        })
        emailDrafts.push(draft)
      }

      if (participant.phone) {
        const draft = await this.commBridge.prepareWhatsAppDraft({
          sessionId: session.sessionId,
          tenantId: session.tenantId,
          userId,
          summary,
          recipientName: participant.name,
          recipientPhone: participant.phone,
        })
        whatsappDrafts.push(draft)
      }
    }

    this.logger.log('follow_up_drafted', session.sessionId, `emails=${emailDrafts.length} whatsapp=${whatsappDrafts.length}`)

    return {
      sessionId: session.sessionId,
      emailDrafts,
      whatsappDrafts,
      participantNotes,
      pendingApprovals: emailDrafts.length + whatsappDrafts.length,
    }
  }
}
