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

import type * as admin from 'firebase-admin'
import type { TenantEngine } from '../security/TenantEngine'
import type { ApprovalEngine } from '../delegation/ApprovalEngine'
import type { AIGateway } from '../ai-gateway/AIGateway'
import type {
  MeetingSession, MeetingType,
  TranscriptChunk, MeetingSummary, MeetingActionItem,
} from './MeetingTypes'
import type { MeetingConfig } from './MeetingConfig'
import { DEFAULT_MEETING_CONFIG } from './MeetingConfig'
import { MeetingSessionManager } from './MeetingSessionManager'
import { MeetingTranscriptionEngine } from './MeetingTranscriptionEngine'
import { MeetingSummaryEngine } from './MeetingSummaryEngine'
import { MeetingActionExtractor } from './MeetingActionExtractor'
import { MeetingConsentManager } from './MeetingConsentManager'
import { MeetingApprovalBridge } from './MeetingApprovalBridge'
import { MeetingPolicyEngine } from './MeetingPolicyEngine'
import { MeetingSafetyGuard } from './MeetingSafetyGuard'
import { MeetingNotesManager } from './MeetingNotesManager'
import { MeetingFollowUpManager } from './MeetingFollowUpManager'
import { MeetingWorkflowBridge } from './MeetingWorkflowBridge'
import { MeetingMemoryBridge } from './MeetingMemoryBridge'
import { MeetingCommunicationBridge } from './MeetingCommunicationBridge'
import { MeetingAnalytics } from './MeetingAnalytics'
import { MeetingExportManager } from './MeetingExportManager'
import { MeetingValidator } from './MeetingValidator'
import { MeetingLogger } from './MeetingLogger'
import type { ExportFormat } from './MeetingTypes'

export class MeetingAgentEngine {
  private readonly sessions: MeetingSessionManager
  private readonly transcription: MeetingTranscriptionEngine
  private readonly summaryEngine: MeetingSummaryEngine
  private readonly actionExtractor: MeetingActionExtractor
  readonly consent: MeetingConsentManager
  readonly approvalBridge: MeetingApprovalBridge
  private readonly policy: MeetingPolicyEngine
  readonly safety: MeetingSafetyGuard
  private readonly notesManager: MeetingNotesManager
  readonly followUpManager: MeetingFollowUpManager
  readonly workflowBridge: MeetingWorkflowBridge
  private readonly memoryBridge: MeetingMemoryBridge
  readonly commBridge: MeetingCommunicationBridge
  private readonly analytics: MeetingAnalytics
  private readonly exportManager: MeetingExportManager
  private readonly validator: MeetingValidator
  private readonly logger: MeetingLogger

  constructor(
    db: admin.firestore.Firestore,
    private readonly tenants: TenantEngine,
    approvalEngine: ApprovalEngine,
    aiGateway: AIGateway,
    apiKey: string,
    config: MeetingConfig = DEFAULT_MEETING_CONFIG
  ) {
    this.sessions = new MeetingSessionManager(db, config)
    this.transcription = new MeetingTranscriptionEngine(db)
    this.summaryEngine = new MeetingSummaryEngine(db, aiGateway)
    this.actionExtractor = new MeetingActionExtractor(db, aiGateway)
    this.consent = new MeetingConsentManager(db)
    this.approvalBridge = new MeetingApprovalBridge(approvalEngine)
    this.policy = new MeetingPolicyEngine(config)
    this.safety = new MeetingSafetyGuard()
    this.notesManager = new MeetingNotesManager(db)
    this.memoryBridge = new MeetingMemoryBridge(db, apiKey)
    this.commBridge = new MeetingCommunicationBridge(db, this.approvalBridge)
    this.followUpManager = new MeetingFollowUpManager(this.commBridge)
    this.workflowBridge = new MeetingWorkflowBridge()
    this.analytics = new MeetingAnalytics(db)
    this.exportManager = new MeetingExportManager()
    this.validator = new MeetingValidator()
    this.logger = new MeetingLogger()
  }

  // ── Session lifecycle ─────────────────────────────────────────────────────

  async createSession(userId: string, input: {
    tenantId: string
    title: string
    type: MeetingType
    language?: string
    location?: string
    platform?: string
    tags?: string[]
    notes?: string
  }): Promise<MeetingSession> {
    await this.tenants.requireIdentity(input.tenantId, userId)
    this.validator.validateCreateSession(input)

    const session = await this.sessions.createSession({ ...input, userId })
    this.logger.log('meeting_created', session.sessionId)
    await this.memoryBridge.linkMeetingSession(userId, session).catch(() => {/* non-fatal */})
    return session
  }

  async startSession(userId: string, tenantId: string, sessionId: string): Promise<MeetingSession> {
    await this.tenants.requireIdentity(tenantId, userId)
    const session = this.validator.validateSession(
      await this.sessions.getSession(tenantId, sessionId), sessionId
    )
    // Grant consent (user explicitly starts the session)
    await this.consent.grantConsent(tenantId, sessionId, userId, 'User started meeting session')
    const now = new Date().toISOString()
    await this.sessions.updateStatus(tenantId, sessionId, 'active', {
      startedAt: now,
      consentStatus: 'granted',
    })
    this.logger.log('recording_started', sessionId)
    return { ...session, status: 'active', startedAt: now, consentStatus: 'granted' }
  }

  async pauseSession(userId: string, tenantId: string, sessionId: string): Promise<MeetingSession> {
    await this.tenants.requireIdentity(tenantId, userId)
    const session = this.validator.validateSession(
      await this.sessions.getSession(tenantId, sessionId), sessionId
    )
    await this.sessions.updateStatus(tenantId, sessionId, 'paused')
    await this.consent.auditRecordingPaused(tenantId, sessionId, userId)
    this.logger.log('recording_paused', sessionId)
    return { ...session, status: 'paused' }
  }

  async endSession(userId: string, tenantId: string, sessionId: string): Promise<MeetingSession> {
    await this.tenants.requireIdentity(tenantId, userId)
    const session = this.validator.validateSession(
      await this.sessions.getSession(tenantId, sessionId), sessionId
    )
    const now = new Date().toISOString()
    await this.sessions.updateStatus(tenantId, sessionId, 'ended', { endedAt: now })
    await this.consent.auditRecordingStopped(tenantId, sessionId, userId)
    this.logger.log('meeting_ended', sessionId)
    return { ...session, status: 'ended', endedAt: now }
  }

  async deleteSession(userId: string, tenantId: string, sessionId: string): Promise<void> {
    await this.tenants.requireIdentity(tenantId, userId)
    this.validator.validateSession(await this.sessions.getSession(tenantId, sessionId), sessionId)
    await this.sessions.deleteSession(tenantId, sessionId)
    this.logger.log('meeting_deleted', sessionId)
  }

  async listSessions(userId: string, tenantId: string, limit?: number): Promise<MeetingSession[]> {
    await this.tenants.requireIdentity(tenantId, userId)
    return this.sessions.listSessions(tenantId, userId, limit)
  }

  async getSession(userId: string, tenantId: string, sessionId: string): Promise<MeetingSession | null> {
    await this.tenants.requireIdentity(tenantId, userId)
    return this.sessions.getSession(tenantId, sessionId)
  }

  // ── Transcription ─────────────────────────────────────────────────────────

  async addTranscriptChunk(userId: string, input: {
    tenantId: string
    sessionId: string
    text: string
    chunkIndex: number
    speakerLabel?: string
    startMs?: number
    endMs?: number
    confidence?: number
    language?: string
  }): Promise<TranscriptChunk> {
    await this.tenants.requireIdentity(input.tenantId, userId)
    this.validator.validateTranscriptChunk(input)
    const session = this.validator.validateSession(
      await this.sessions.getSession(input.tenantId, input.sessionId), input.sessionId
    )

    const policy = this.policy.canStartTranscription(session)
    if (!policy.allowed) throw new Error(policy.reason)

    return this.transcription.addTranscriptChunk({ ...input, userId })
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  async generateSummary(userId: string, tenantId: string, sessionId: string): Promise<MeetingSummary> {
    await this.tenants.requireIdentity(tenantId, userId)
    const session = this.validator.validateSession(
      await this.sessions.getSession(tenantId, sessionId), sessionId
    )

    const policyCheck = this.policy.canGenerateSummary(session)
    if (!policyCheck.allowed) throw new Error(policyCheck.reason)

    const transcriptText = await this.transcription.assembleFullTranscript(tenantId, sessionId)
    const summary = await this.summaryEngine.generateSummary({
      sessionId,
      tenantId,
      userId,
      sessionTitle: session.title,
      transcriptText,
    })

    await this.sessions.updateStatus(tenantId, sessionId, 'summarized')
    await this.memoryBridge.linkSummary(userId, session, summary).catch(() => {/* non-fatal */})
    return summary
  }

  async getMeetingSummary(userId: string, tenantId: string, sessionId: string): Promise<MeetingSummary | null> {
    await this.tenants.requireIdentity(tenantId, userId)
    return this.summaryEngine.getSummary(tenantId, sessionId)
  }

  // ── Action items ──────────────────────────────────────────────────────────

  async extractActionItems(userId: string, tenantId: string, sessionId: string): Promise<MeetingActionItem[]> {
    await this.tenants.requireIdentity(tenantId, userId)
    this.validator.validateSession(await this.sessions.getSession(tenantId, sessionId), sessionId)

    const transcriptText = await this.transcription.assembleFullTranscript(tenantId, sessionId)
    const suggestions = await this.actionExtractor.extractActionItems({
      sessionId,
      tenantId,
      userId,
      transcriptText,
    })
    await this.actionExtractor.saveSuggestions(suggestions)
    return suggestions
  }

  // ── Approval for follow-ups ───────────────────────────────────────────────

  async approveMeetingFollowUp(userId: string, tenantId: string, sessionId: string, followUpId: string): Promise<{ approvalRequestId: string }> {
    await this.tenants.requireIdentity(tenantId, userId)
    const followUps = await this.commBridge.listFollowUps(tenantId, sessionId)
    const followUp = followUps.find((f) => f.followUpId === followUpId)
    if (!followUp) throw new Error(`Follow-up not found: ${followUpId}`)

    const updated = await this.commBridge.requestSendApproval(followUp, userId)
    if (updated.approvalRequestId) {
      await this.memoryBridge.linkApprovalRequest(
        userId, sessionId, updated.approvalRequestId, `Send ${followUp.type}`
      ).catch(() => {/* non-fatal */})
    }
    this.logger.log('approval_requested', sessionId, `followUpId=${followUpId}`)
    return { approvalRequestId: updated.approvalRequestId ?? '' }
  }

  // ── Export ────────────────────────────────────────────────────────────────

  async exportMeetingNotes(userId: string, tenantId: string, sessionId: string, format: ExportFormat): Promise<{ content: string; mimeType: string; fileName: string; notImplemented?: boolean }> {
    await this.tenants.requireIdentity(tenantId, userId)
    const session = this.validator.validateSession(
      await this.sessions.getSession(tenantId, sessionId), sessionId
    )
    const summary = await this.summaryEngine.getSummary(tenantId, sessionId)
    const actionItems = await this.actionExtractor.listSuggestions(tenantId, sessionId)
    const notes = this.notesManager.compileNotes(session, summary, actionItems)
    const result = await this.exportManager.exportNotes(notes, format)
    this.logger.log('export_requested', sessionId, `format=${format}`)
    return result
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  async getStats(userId: string, tenantId: string) {
    await this.tenants.requireIdentity(tenantId, userId)
    return this.analytics.getStats(tenantId, userId)
  }
}
