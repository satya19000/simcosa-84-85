"use strict";
/**
 * MeetingValidator.ts — input validation for meeting agent operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingValidator = void 0;
const VALID_MEETING_TYPES = [
    'voiceNote', 'phoneCallNote', 'onlineMeeting', 'physicalMeeting',
    'consultation', 'reviewMeeting', 'publicHealthMeeting', 'custom',
];
class MeetingValidator {
    validateCreateSession(input) {
        if (!input.title || typeof input.title !== 'string' || !input.title.trim()) {
            throw new Error('title is required');
        }
        if (!input.type || !VALID_MEETING_TYPES.includes(input.type)) {
            throw new Error(`type must be one of: ${VALID_MEETING_TYPES.join(', ')}`);
        }
        if (!input.tenantId || typeof input.tenantId !== 'string' || !input.tenantId.trim()) {
            throw new Error('tenantId is required');
        }
    }
    validateTranscriptChunk(input) {
        if (!input.text || typeof input.text !== 'string' || !input.text.trim()) {
            throw new Error('transcript text is required');
        }
        if (typeof input.chunkIndex !== 'number' || input.chunkIndex < 0) {
            throw new Error('chunkIndex must be a non-negative number');
        }
    }
    validateSession(session, sessionId) {
        if (!session)
            throw new Error(`Meeting session not found: ${sessionId}`);
        return session;
    }
    validateActive(session) {
        if (session.status !== 'active') {
            throw new Error(`Session is not active (status: ${session.status})`);
        }
    }
}
exports.MeetingValidator = MeetingValidator;
//# sourceMappingURL=MeetingValidator.js.map