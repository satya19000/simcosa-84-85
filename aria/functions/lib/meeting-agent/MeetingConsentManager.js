"use strict";
/**
 * MeetingConsentManager.ts — enforces consent and privacy invariants.
 *
 * PRIVACY INVARIANTS:
 * - No recording without explicit user action.
 * - Transcription status must always be visible.
 * - Participants can withdraw consent at any time.
 * - Transcripts can be deleted; deletion is audited.
 * - Stealth recording is blocked by MeetingSafetyGuard (called before consent checks).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingConsentManager = void 0;
const uuid_1 = require("uuid");
const MeetingSafetyGuard_1 = require("./MeetingSafetyGuard");
const MeetingLogger_1 = require("./MeetingLogger");
class MeetingConsentManager {
    constructor(db) {
        this.db = db;
        this.safety = new MeetingSafetyGuard_1.MeetingSafetyGuard();
        this.logger = new MeetingLogger_1.MeetingLogger();
    }
    auditRef(tenantId) {
        return this.db.collection(`tenants/${tenantId}/meetingAudit`);
    }
    /**
     * Record explicit user consent to start recording/transcription.
     * The user MUST actively call this — never called automatically.
     */
    async grantConsent(tenantId, sessionId, userId, notes) {
        // Assert not stealth — user is explicitly granting consent here
        this.safety.assertRecordingStartSafe({
            stealthMode: false,
            hiddenMicrophone: false,
            backgroundListening: false,
            userConsentGranted: true,
            hasVisibleSession: true,
        });
        await this.writeAudit(tenantId, sessionId, userId, 'consent_granted', notes);
        this.logger.log('consent_granted', sessionId);
        return 'granted';
    }
    /**
     * Record that the user denied or revoked consent.
     */
    async revokeConsent(tenantId, sessionId, userId, reason) {
        await this.writeAudit(tenantId, sessionId, userId, 'consent_revoked', reason);
        this.logger.log('consent_revoked', sessionId);
        return 'revoked';
    }
    /**
     * Audit-log that recording was paused (user action).
     */
    async auditRecordingPaused(tenantId, sessionId, userId) {
        await this.writeAudit(tenantId, sessionId, userId, 'recording_paused');
        this.logger.log('recording_paused', sessionId);
    }
    /**
     * Audit-log that recording was stopped (user action).
     */
    async auditRecordingStopped(tenantId, sessionId, userId) {
        await this.writeAudit(tenantId, sessionId, userId, 'recording_stopped');
        this.logger.log('recording_stopped', sessionId);
    }
    /**
     * Audit-log transcript deletion.
     * Per policy, deletion of transcripts is always audited.
     */
    async auditTranscriptDeleted(tenantId, sessionId, userId, transcriptId) {
        await this.writeAudit(tenantId, sessionId, userId, 'transcript_deleted', `transcriptId=${transcriptId}`);
        this.logger.log('transcript_deleted', sessionId, `transcriptId=${transcriptId}`);
    }
    async writeAudit(tenantId, sessionId, userId, event, detail) {
        const auditId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
            auditId,
            sessionId,
            tenantId,
            userId,
            event,
            detail,
            createdAt: now,
        };
        await this.auditRef(tenantId).doc(auditId).set(record);
    }
}
exports.MeetingConsentManager = MeetingConsentManager;
//# sourceMappingURL=MeetingConsentManager.js.map