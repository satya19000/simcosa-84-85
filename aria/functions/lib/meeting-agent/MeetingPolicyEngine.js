"use strict";
/**
 * MeetingPolicyEngine.ts — policy checks for meeting agent operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingPolicyEngine = void 0;
class MeetingPolicyEngine {
    constructor(config) {
        this.config = config;
    }
    /**
     * Derive policy for a given meeting type.
     * Public health meetings and phone calls have stricter defaults.
     */
    getPolicyForType(type) {
        const base = {
            allowRecording: false, // always off by default
            allowTranscription: true,
            allowAISummary: this.config.aiSummaryEnabledByDefault,
            requireParticipantConsent: this.config.requireParticipantConsent,
            allowExport: true,
            maxParticipants: this.config.maxParticipantsPerSession,
            maxChunks: this.config.maxTranscriptChunksPerSession,
        };
        switch (type) {
            case 'publicHealthMeeting':
                return {
                    ...base,
                    requireParticipantConsent: true,
                    allowRecording: false, // must remain false; explicit consent required per type
                };
            case 'phoneCallNote':
                return {
                    ...base,
                    requireParticipantConsent: true,
                };
            case 'voiceNote':
                // Voice notes are personal — no participant consent needed
                return {
                    ...base,
                    requireParticipantConsent: false,
                };
            default:
                return base;
        }
    }
    /**
     * Check whether a session is allowed to start transcription.
     */
    canStartTranscription(session) {
        if (!session.transcriptionEnabled) {
            return { allowed: false, reason: 'Transcription is disabled for this session.' };
        }
        if (session.status === 'deleted' || session.status === 'archived') {
            return { allowed: false, reason: 'Cannot transcribe a deleted or archived session.' };
        }
        if (session.consentStatus !== 'granted' && session.consentStatus !== 'notRequired') {
            return { allowed: false, reason: 'Consent is required before transcription can begin.' };
        }
        return { allowed: true };
    }
    /**
     * Check whether AI summary can be generated.
     */
    canGenerateSummary(session) {
        if (!session.aiSummaryEnabled) {
            return { allowed: false, reason: 'AI summary is disabled for this session.' };
        }
        const allowed = ['ended', 'processing', 'summarized'].includes(session.status);
        if (!allowed) {
            return { allowed: false, reason: `Session must be ended before summary can be generated (status: ${session.status}).` };
        }
        return { allowed: true };
    }
}
exports.MeetingPolicyEngine = MeetingPolicyEngine;
//# sourceMappingURL=MeetingPolicyEngine.js.map