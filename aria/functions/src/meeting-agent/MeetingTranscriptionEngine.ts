/**
 * MeetingTranscriptionEngine.ts — manages transcript storage and retrieval.
 *
 * Transcription pipeline:
 * - Live partial transcript: placeholder (requires frontend browser APIs)
 * - Finalized transcript chunks: real — stored to Firestore
 * - Speaker label: placeholder
 * - Timestamped transcript: stored when provided
 * - Language detection: placeholder
 * - Confidence score: stored when provided
 * - Transcript correction: real — updates existing chunk
 *
 * All AI processing routes through the AI Gateway, not direct provider calls.
 */

import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { TranscriptChunk, TranscriptChunkStatus } from './MeetingTypes'
import { MeetingLogger } from './MeetingLogger'

const TRANSCRIPTS_COL = (tenantId: string) => `tenants/${tenantId}/meetingTranscripts`

export class MeetingTranscriptionEngine {
  private readonly logger = new MeetingLogger()

  constructor(private readonly db: admin.firestore.Firestore) {}

  /**
   * Add a finalized transcript chunk to Firestore.
   * This is REAL — chunk is persisted.
   *
   * PRIVACY: we do NOT log the text content here.
   */
  async addTranscriptChunk(input: {
    sessionId: string
    tenantId: string
    userId: string
    text: string
    chunkIndex: number
    speakerLabel?: string
    startMs?: number
    endMs?: number
    confidence?: number
    language?: string
    status?: TranscriptChunkStatus
  }): Promise<TranscriptChunk> {
    const transcriptId = uuidv4()
    const now = new Date().toISOString()
    const chunk: TranscriptChunk = {
      transcriptId,
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      userId: input.userId,
      text: input.text,
      speakerLabel: input.speakerLabel,
      startMs: input.startMs,
      endMs: input.endMs,
      confidence: input.confidence,
      language: input.language,
      status: input.status ?? 'finalized',
      chunkIndex: input.chunkIndex,
      createdAt: now,
    }
    await this.db.collection(TRANSCRIPTS_COL(input.tenantId)).doc(transcriptId).set(chunk)
    // Log event without transcript content
    this.logger.log('transcript_added', input.sessionId, `chunkIndex=${input.chunkIndex}`)
    return chunk
  }

  /**
   * Retrieve all transcript chunks for a session, ordered by chunkIndex.
   */
  async getTranscriptChunks(tenantId: string, sessionId: string): Promise<TranscriptChunk[]> {
    const snap = await this.db
      .collection(TRANSCRIPTS_COL(tenantId))
      .where('sessionId', '==', sessionId)
      .orderBy('chunkIndex', 'asc')
      .get()
    return snap.docs.map((d) => d.data() as TranscriptChunk)
  }

  /**
   * Correct an existing transcript chunk.
   */
  async correctChunk(tenantId: string, transcriptId: string, correctedText: string): Promise<void> {
    await this.db.collection(TRANSCRIPTS_COL(tenantId)).doc(transcriptId).update({
      text: correctedText,
      status: 'finalized' as TranscriptChunkStatus,
    })
  }

  /**
   * Delete a transcript chunk (requires consent audit before calling this).
   */
  async deleteChunk(tenantId: string, transcriptId: string): Promise<void> {
    await this.db.collection(TRANSCRIPTS_COL(tenantId)).doc(transcriptId).delete()
  }

  /**
   * Delete all transcript chunks for a session.
   * Requires audit trail — caller must invoke MeetingConsentManager.auditTranscriptDeleted first.
   */
  async deleteAllChunks(tenantId: string, sessionId: string): Promise<number> {
    const snap = await this.db
      .collection(TRANSCRIPTS_COL(tenantId))
      .where('sessionId', '==', sessionId)
      .get()
    const batch = this.db.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    this.logger.log('transcript_deleted', sessionId, `count=${snap.docs.length}`)
    return snap.docs.length
  }

  /**
   * Assemble all chunks into a full transcript string.
   * Used internally by summary engine — not exposed directly.
   */
  async assembleFullTranscript(tenantId: string, sessionId: string): Promise<string> {
    const chunks = await this.getTranscriptChunks(tenantId, sessionId)
    return chunks.map((c) => c.text).join('\n')
  }

  // ── Placeholder capabilities ──────────────────────────────────────────────

  /**
   * Live partial transcript — placeholder.
   * Browser Web Speech API can only be called from frontend browser context.
   * Backend cannot access microphone directly.
   */
  getLivePartialTranscript(): { success: false; notImplemented: true; reason: string } {
    return {
      success: false,
      notImplemented: true,
      reason: 'Live partial transcript requires browser Web Speech API running in the frontend. The backend cannot capture audio.',
    }
  }

  /**
   * Speaker label detection — placeholder.
   */
  getSpeakerLabel(): { success: false; notImplemented: true; reason: string } {
    return {
      success: false,
      notImplemented: true,
      reason: 'Speaker diarization requires a real-time STT provider integration (e.g., AssemblyAI, Deepgram). Not yet implemented.',
    }
  }

  /**
   * Language detection — placeholder.
   */
  detectLanguage(): { success: false; notImplemented: true; reason: string } {
    return {
      success: false,
      notImplemented: true,
      reason: 'Automatic language detection requires a streaming STT provider. Not yet implemented.',
    }
  }
}
