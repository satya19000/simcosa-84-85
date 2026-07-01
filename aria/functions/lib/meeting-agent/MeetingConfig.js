"use strict";
/**
 * MeetingConfig.ts — configuration types and defaults for the Meeting Agent.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MEETING_CONFIG = void 0;
exports.DEFAULT_MEETING_CONFIG = {
    maxTranscriptChunksPerSession: 10000,
    maxParticipantsPerSession: 500,
    aiSummaryEnabledByDefault: true,
    recordingEnabledByDefault: false, // off by default — user must explicitly enable
    sessionTtlMs: 20 * 60 * 1000,
    requireParticipantConsent: true,
    requireAuditForTranscriptDeletion: true,
};
//# sourceMappingURL=MeetingConfig.js.map