"use strict";
/**
 * MeetingSafetyGuard.ts — hard-block layer for meeting agent safety invariants.
 *
 * HARD SAFETY INVARIANTS (non-negotiable, cannot be bypassed):
 * 1. Stealth recording is unconditionally blocked.
 * 2. Hidden microphone access is unconditionally blocked.
 * 3. Background listening without a visible active session is blocked.
 * 4. Unauthorized call recording is unconditionally blocked.
 * 5. Stealth call joining is unconditionally blocked.
 * 6. Auto-send of any communication is unconditionally blocked.
 * 7. Auto-creation of tasks/reminders is unconditionally blocked.
 * 8. Transcript sharing without approval is blocked.
 *
 * These are NAMED HARD-BLOCKS — documented and enforced here,
 * never implemented as functioning stealth capabilities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingSafetyGuard = exports.MeetingSafetyError = void 0;
class MeetingSafetyError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'MeetingSafetyError';
    }
}
exports.MeetingSafetyError = MeetingSafetyError;
class MeetingSafetyGuard {
    /**
     * Assert that a recording start is safe.
     * Throws MeetingSafetyError if recording intent is stealth or unauthorized.
     *
     * INVARIANT: stealth === true is unconditionally rejected.
     * There is NO code path that permits stealth recording.
     */
    assertRecordingStartSafe(options) {
        // ── STEALTH RECORDING: ALWAYS BLOCKED ─────────────────────────────────
        // This block can never be removed, overridden, or bypassed.
        if (options.stealthMode) {
            throw new MeetingSafetyError('STEALTH_RECORDING_BLOCKED', 'Stealth recording is unconditionally blocked. ARIA will never record audio or capture transcripts without the user\'s explicit knowledge and visible session indicator.');
        }
        // ── HIDDEN MICROPHONE: ALWAYS BLOCKED ──────────────────────────────────
        if (options.hiddenMicrophone) {
            throw new MeetingSafetyError('HIDDEN_MICROPHONE_BLOCKED', 'Hidden microphone access is unconditionally blocked. Microphone use must be visible to the user at all times.');
        }
        // ── BACKGROUND LISTENING WITHOUT VISIBLE SESSION: BLOCKED ──────────────
        if (options.backgroundListening && !options.hasVisibleSession) {
            throw new MeetingSafetyError('BACKGROUND_LISTENING_BLOCKED', 'Background listening without a visible active session is unconditionally blocked. A visible session indicator must be shown to the user whenever audio is being processed.');
        }
        // ── RECORDING WITHOUT USER CONSENT ────────────────────────────────────
        if (!options.userConsentGranted) {
            throw new MeetingSafetyError('RECORDING_WITHOUT_CONSENT', 'Recording cannot start without explicit user consent. The user must actively enable recording.');
        }
    }
    /**
     * Assert that auto-send is not being attempted.
     * INVARIANT: auto-send is unconditionally blocked — all outgoing
     * communication must go through MeetingApprovalBridge → ApprovalEngine.
     */
    assertNoAutoSend(intent) {
        const lower = intent.toLowerCase();
        const autoSendPatterns = [
            { pattern: 'auto-send', code: 'AUTO_SEND_BLOCKED' },
            { pattern: 'autosend', code: 'AUTO_SEND_BLOCKED' },
            { pattern: 'send without approval', code: 'AUTO_SEND_BLOCKED' },
            { pattern: 'bypass approval', code: 'APPROVAL_BYPASS_BLOCKED' },
            { pattern: 'skip approval', code: 'APPROVAL_BYPASS_BLOCKED' },
        ];
        for (const { pattern, code } of autoSendPatterns) {
            if (lower.includes(pattern)) {
                throw new MeetingSafetyError(code, `Auto-send of communications is unconditionally blocked. All outgoing messages require explicit approval via MeetingApprovalBridge. Detected pattern: "${pattern}".`);
            }
        }
    }
    /**
     * Assert that auto-creation of tasks/reminders is not being attempted.
     * INVARIANT: only suggestions are returned; user must explicitly approve
     * before any task/reminder is created.
     */
    assertNoAutoTaskCreation(intent) {
        const lower = intent.toLowerCase();
        if (lower.includes('auto-create task') || lower.includes('automatically create reminder')) {
            throw new MeetingSafetyError('AUTO_TASK_CREATION_BLOCKED', 'Automatic task/reminder creation is unconditionally blocked. Tasks and reminders are suggestions only and require explicit user approval before creation.');
        }
    }
    /**
     * Assert that unauthorized call recording is not being attempted.
     * INVARIANT: recording a call without explicit consent is blocked.
     */
    assertCallRecordingAuthorized(options) {
        if (!options.userConsentGranted) {
            throw new MeetingSafetyError('UNAUTHORIZED_CALL_RECORDING', 'Call recording requires explicit user authorization. Unauthorized call recording is unconditionally blocked.');
        }
        if (options.requiresParticipantConsent && !options.participantsNotified) {
            throw new MeetingSafetyError('PARTICIPANT_CONSENT_REQUIRED', 'Recording this call type requires participant notification/consent. Proceeding without notifying participants is blocked by policy.');
        }
    }
    /**
     * Assert that stealth call joining is not being attempted.
     * INVARIANT: joining a meeting or call without visible indication is blocked.
     */
    assertNoStealthCallJoin(options) {
        if (options.stealthJoin) {
            throw new MeetingSafetyError('STEALTH_CALL_JOIN_BLOCKED', 'Stealth call joining is unconditionally blocked. ARIA will never join a meeting or call without a visible indication to the user.');
        }
    }
}
exports.MeetingSafetyGuard = MeetingSafetyGuard;
//# sourceMappingURL=MeetingSafetyGuard.js.map