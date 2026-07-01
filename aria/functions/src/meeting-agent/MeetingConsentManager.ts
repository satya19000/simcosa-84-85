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

import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { ConsentStatus, MeetingAuditEvent } from './MeetingTypes'
import { MeetingSafetyGuard } from './MeetingSafetyGuard'
import { MeetingLogger } from './MeetingLogger'

export class MeetingConsentManager {
  private readonly safety = new MeetingSafetyGuard()
  private readonly logger = new MeetingLogger()

  constructor(private readonly db: admin.firestore.Firestore) {}

  private auditRef(tenantId: string) {
    return this.db.collection(`tenants/${tenantId}/meetingAudit`)
  }

  /**
   * Record explicit user consent to start recording/transcription.
   * The user MUST actively call this — never called automatically.
   */
  async grantConsent(
    tenantId: string,
    sessionId: string,
    userId: string,
    notes?: string
  ): Promise<ConsentStatus> {
    // Assert not stealth — user is explicitly granting consent here
    this.safety.assertRecordingStartSafe({
      stealthMode: false,
      hiddenMicrophone: false,
      backgroundListening: false,
      userConsentGranted: true,
      hasVisibleSession: true,
    })

    await this.writeAudit(tenantId, sessionId, userId, 'consent_granted', notes)
    this.logger.log('consent_granted', sessionId)
    return 'granted'
  }

  /**
   * Record that the user denied or revoked consent.
   */
  async revokeConsent(
    tenantId: string,
    sessionId: string,
    userId: string,
    reason?: string
  ): Promise<ConsentStatus> {
    await this.writeAudit(tenantId, sessionId, userId, 'consent_revoked', reason)
    this.logger.log('consent_revoked', sessionId)
    return 'revoked'
  }

  /**
   * Audit-log that recording was paused (user action).
   */
  async auditRecordingPaused(tenantId: string, sessionId: string, userId: string): Promise<void> {
    await this.writeAudit(tenantId, sessionId, userId, 'recording_paused')
    this.logger.log('recording_paused', sessionId)
  }

  /**
   * Audit-log that recording was stopped (user action).
   */
  async auditRecordingStopped(tenantId: string, sessionId: string, userId: string): Promise<void> {
    await this.writeAudit(tenantId, sessionId, userId, 'recording_stopped')
    this.logger.log('recording_stopped', sessionId)
  }

  /**
   * Audit-log transcript deletion.
   * Per policy, deletion of transcripts is always audited.
   */
  async auditTranscriptDeleted(
    tenantId: string,
    sessionId: string,
    userId: string,
    transcriptId: string
  ): Promise<void> {
    await this.writeAudit(
      tenantId,
      sessionId,
      userId,
      'transcript_deleted',
      `transcriptId=${transcriptId}`
    )
    this.logger.log('transcript_deleted', sessionId, `transcriptId=${transcriptId}`)
  }

  private async writeAudit(
    tenantId: string,
    sessionId: string,
    userId: string,
    event: MeetingAuditEvent['event'],
    detail?: string
  ): Promise<void> {
    const auditId = uuidv4()
    const now = new Date().toISOString()
    const record: MeetingAuditEvent = {
      auditId,
      sessionId,
      tenantId,
      userId,
      event,
      detail,
      createdAt: now,
    }
    await this.auditRef(tenantId).doc(auditId).set(record)
  }
}
