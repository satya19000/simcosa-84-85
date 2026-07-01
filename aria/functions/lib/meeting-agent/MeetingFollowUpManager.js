"use strict";
/**
 * MeetingFollowUpManager.ts — orchestrates post-meeting follow-up workflows.
 *
 * SAFETY: All outgoing communications go through MeetingCommunicationBridge
 * which routes through MeetingApprovalBridge → ApprovalEngine.
 * Nothing is sent automatically.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingFollowUpManager = void 0;
const MeetingLogger_1 = require("./MeetingLogger");
class MeetingFollowUpManager {
    constructor(commBridge) {
        this.commBridge = commBridge;
        this.logger = new MeetingLogger_1.MeetingLogger();
    }
    /**
     * Generate follow-up drafts for all participants who have an email.
     * Returns drafts only — nothing is sent.
     */
    async generateFollowUpDrafts(session, summary, userId) {
        const emailDrafts = [];
        const whatsappDrafts = [];
        const participantNotes = [];
        for (const participant of session.participants) {
            if (participant.email) {
                const draft = await this.commBridge.prepareSummaryEmailDraft({
                    sessionId: session.sessionId,
                    tenantId: session.tenantId,
                    userId,
                    summary,
                    recipientName: participant.name,
                    recipientEmail: participant.email,
                });
                emailDrafts.push(draft);
            }
            if (participant.phone) {
                const draft = await this.commBridge.prepareWhatsAppDraft({
                    sessionId: session.sessionId,
                    tenantId: session.tenantId,
                    userId,
                    summary,
                    recipientName: participant.name,
                    recipientPhone: participant.phone,
                });
                whatsappDrafts.push(draft);
            }
        }
        this.logger.log('follow_up_drafted', session.sessionId, `emails=${emailDrafts.length} whatsapp=${whatsappDrafts.length}`);
        return {
            sessionId: session.sessionId,
            emailDrafts,
            whatsappDrafts,
            participantNotes,
            pendingApprovals: emailDrafts.length + whatsappDrafts.length,
        };
    }
}
exports.MeetingFollowUpManager = MeetingFollowUpManager;
//# sourceMappingURL=MeetingFollowUpManager.js.map