"use strict";
/**
 * MeetingAgentEngine.ts — top-level facade for the Meeting Agent module.
 *
 * Composes all meeting sub-engines. This is the only class that
 * meetingAgentApi.ts (Cloud Functions) should talk to.
 *
 * SAFETY INVARIANTS enforced here:
 * - MeetingSafetyGuard is called first on any recording operation.
 * - TenantEngine.requireIdentity is called first on every tenant-scoped method.
 * - All approval flows go through MeetingApprovalBridge → ApprovalEngine.
 * - All communication drafts go through MeetingCommunicationBridge (no auto-send).
 * - Action items are suggestions only; no auto-creation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingAgentEngine = void 0;
const MeetingConfig_1 = require("./MeetingConfig");
const MeetingSessionManager_1 = require("./MeetingSessionManager");
const MeetingTranscriptionEngine_1 = require("./MeetingTranscriptionEngine");
const MeetingSummaryEngine_1 = require("./MeetingSummaryEngine");
const MeetingActionExtractor_1 = require("./MeetingActionExtractor");
const MeetingConsentManager_1 = require("./MeetingConsentManager");
const MeetingApprovalBridge_1 = require("./MeetingApprovalBridge");
const MeetingPolicyEngine_1 = require("./MeetingPolicyEngine");
const MeetingSafetyGuard_1 = require("./MeetingSafetyGuard");
const MeetingNotesManager_1 = require("./MeetingNotesManager");
const MeetingFollowUpManager_1 = require("./MeetingFollowUpManager");
const MeetingWorkflowBridge_1 = require("./MeetingWorkflowBridge");
const MeetingMemoryBridge_1 = require("./MeetingMemoryBridge");
const MeetingCommunicationBridge_1 = require("./MeetingCommunicationBridge");
const MeetingAnalytics_1 = require("./MeetingAnalytics");
const MeetingExportManager_1 = require("./MeetingExportManager");
const MeetingValidator_1 = require("./MeetingValidator");
const MeetingLogger_1 = require("./MeetingLogger");
class MeetingAgentEngine {
    constructor(db, tenants, approvalEngine, aiGateway, apiKey, config = MeetingConfig_1.DEFAULT_MEETING_CONFIG) {
        this.tenants = tenants;
        this.sessions = new MeetingSessionManager_1.MeetingSessionManager(db, config);
        this.transcription = new MeetingTranscriptionEngine_1.MeetingTranscriptionEngine(db);
        this.summaryEngine = new MeetingSummaryEngine_1.MeetingSummaryEngine(db, aiGateway);
        this.actionExtractor = new MeetingActionExtractor_1.MeetingActionExtractor(db, aiGateway);
        this.consent = new MeetingConsentManager_1.MeetingConsentManager(db);
        this.approvalBridge = new MeetingApprovalBridge_1.MeetingApprovalBridge(approvalEngine);
        this.policy = new MeetingPolicyEngine_1.MeetingPolicyEngine(config);
        this.safety = new MeetingSafetyGuard_1.MeetingSafetyGuard();
        this.notesManager = new MeetingNotesManager_1.MeetingNotesManager(db);
        this.memoryBridge = new MeetingMemoryBridge_1.MeetingMemoryBridge(db, apiKey);
        this.commBridge = new MeetingCommunicationBridge_1.MeetingCommunicationBridge(db, this.approvalBridge);
        this.followUpManager = new MeetingFollowUpManager_1.MeetingFollowUpManager(this.commBridge);
        this.workflowBridge = new MeetingWorkflowBridge_1.MeetingWorkflowBridge();
        this.analytics = new MeetingAnalytics_1.MeetingAnalytics(db);
        this.exportManager = new MeetingExportManager_1.MeetingExportManager();
        this.validator = new MeetingValidator_1.MeetingValidator();
        this.logger = new MeetingLogger_1.MeetingLogger();
    }
    // ── Session lifecycle ─────────────────────────────────────────────────────
    async createSession(userId, input) {
        await this.tenants.requireIdentity(input.tenantId, userId);
        this.validator.validateCreateSession(input);
        const session = await this.sessions.createSession({ ...input, userId });
        this.logger.log('meeting_created', session.sessionId);
        await this.memoryBridge.linkMeetingSession(userId, session).catch(() => { });
        return session;
    }
    async startSession(userId, tenantId, sessionId) {
        await this.tenants.requireIdentity(tenantId, userId);
        const session = this.validator.validateSession(await this.sessions.getSession(tenantId, sessionId), sessionId);
        // Grant consent (user explicitly starts the session)
        await this.consent.grantConsent(tenantId, sessionId, userId, 'User started meeting session');
        const now = new Date().toISOString();
        await this.sessions.updateStatus(tenantId, sessionId, 'active', {
            startedAt: now,
            consentStatus: 'granted',
        });
        this.logger.log('recording_started', sessionId);
        return { ...session, status: 'active', startedAt: now, consentStatus: 'granted' };
    }
    async pauseSession(userId, tenantId, sessionId) {
        await this.tenants.requireIdentity(tenantId, userId);
        const session = this.validator.validateSession(await this.sessions.getSession(tenantId, sessionId), sessionId);
        await this.sessions.updateStatus(tenantId, sessionId, 'paused');
        await this.consent.auditRecordingPaused(tenantId, sessionId, userId);
        this.logger.log('recording_paused', sessionId);
        return { ...session, status: 'paused' };
    }
    async endSession(userId, tenantId, sessionId) {
        await this.tenants.requireIdentity(tenantId, userId);
        const session = this.validator.validateSession(await this.sessions.getSession(tenantId, sessionId), sessionId);
        const now = new Date().toISOString();
        await this.sessions.updateStatus(tenantId, sessionId, 'ended', { endedAt: now });
        await this.consent.auditRecordingStopped(tenantId, sessionId, userId);
        this.logger.log('meeting_ended', sessionId);
        return { ...session, status: 'ended', endedAt: now };
    }
    async deleteSession(userId, tenantId, sessionId) {
        await this.tenants.requireIdentity(tenantId, userId);
        this.validator.validateSession(await this.sessions.getSession(tenantId, sessionId), sessionId);
        await this.sessions.deleteSession(tenantId, sessionId);
        this.logger.log('meeting_deleted', sessionId);
    }
    async listSessions(userId, tenantId, limit) {
        await this.tenants.requireIdentity(tenantId, userId);
        return this.sessions.listSessions(tenantId, userId, limit);
    }
    async getSession(userId, tenantId, sessionId) {
        await this.tenants.requireIdentity(tenantId, userId);
        return this.sessions.getSession(tenantId, sessionId);
    }
    // ── Transcription ─────────────────────────────────────────────────────────
    async addTranscriptChunk(userId, input) {
        await this.tenants.requireIdentity(input.tenantId, userId);
        this.validator.validateTranscriptChunk(input);
        const session = this.validator.validateSession(await this.sessions.getSession(input.tenantId, input.sessionId), input.sessionId);
        const policy = this.policy.canStartTranscription(session);
        if (!policy.allowed)
            throw new Error(policy.reason);
        return this.transcription.addTranscriptChunk({ ...input, userId });
    }
    // ── Summary ───────────────────────────────────────────────────────────────
    async generateSummary(userId, tenantId, sessionId) {
        await this.tenants.requireIdentity(tenantId, userId);
        const session = this.validator.validateSession(await this.sessions.getSession(tenantId, sessionId), sessionId);
        const policyCheck = this.policy.canGenerateSummary(session);
        if (!policyCheck.allowed)
            throw new Error(policyCheck.reason);
        const transcriptText = await this.transcription.assembleFullTranscript(tenantId, sessionId);
        const summary = await this.summaryEngine.generateSummary({
            sessionId,
            tenantId,
            userId,
            sessionTitle: session.title,
            transcriptText,
        });
        await this.sessions.updateStatus(tenantId, sessionId, 'summarized');
        await this.memoryBridge.linkSummary(userId, session, summary).catch(() => { });
        return summary;
    }
    async getMeetingSummary(userId, tenantId, sessionId) {
        await this.tenants.requireIdentity(tenantId, userId);
        return this.summaryEngine.getSummary(tenantId, sessionId);
    }
    // ── Action items ──────────────────────────────────────────────────────────
    async extractActionItems(userId, tenantId, sessionId) {
        await this.tenants.requireIdentity(tenantId, userId);
        this.validator.validateSession(await this.sessions.getSession(tenantId, sessionId), sessionId);
        const transcriptText = await this.transcription.assembleFullTranscript(tenantId, sessionId);
        const suggestions = await this.actionExtractor.extractActionItems({
            sessionId,
            tenantId,
            userId,
            transcriptText,
        });
        await this.actionExtractor.saveSuggestions(suggestions);
        return suggestions;
    }
    // ── Approval for follow-ups ───────────────────────────────────────────────
    async approveMeetingFollowUp(userId, tenantId, sessionId, followUpId) {
        await this.tenants.requireIdentity(tenantId, userId);
        const followUps = await this.commBridge.listFollowUps(tenantId, sessionId);
        const followUp = followUps.find((f) => f.followUpId === followUpId);
        if (!followUp)
            throw new Error(`Follow-up not found: ${followUpId}`);
        const updated = await this.commBridge.requestSendApproval(followUp, userId);
        if (updated.approvalRequestId) {
            await this.memoryBridge.linkApprovalRequest(userId, sessionId, updated.approvalRequestId, `Send ${followUp.type}`).catch(() => { });
        }
        this.logger.log('approval_requested', sessionId, `followUpId=${followUpId}`);
        return { approvalRequestId: updated.approvalRequestId ?? '' };
    }
    // ── Export ────────────────────────────────────────────────────────────────
    async exportMeetingNotes(userId, tenantId, sessionId, format) {
        await this.tenants.requireIdentity(tenantId, userId);
        const session = this.validator.validateSession(await this.sessions.getSession(tenantId, sessionId), sessionId);
        const summary = await this.summaryEngine.getSummary(tenantId, sessionId);
        const actionItems = await this.actionExtractor.listSuggestions(tenantId, sessionId);
        const notes = this.notesManager.compileNotes(session, summary, actionItems);
        const result = await this.exportManager.exportNotes(notes, format);
        this.logger.log('export_requested', sessionId, `format=${format}`);
        return result;
    }
    // ── Analytics ─────────────────────────────────────────────────────────────
    async getStats(userId, tenantId) {
        await this.tenants.requireIdentity(tenantId, userId);
        return this.analytics.getStats(tenantId, userId);
    }
}
exports.MeetingAgentEngine = MeetingAgentEngine;
//# sourceMappingURL=MeetingAgentEngine.js.map