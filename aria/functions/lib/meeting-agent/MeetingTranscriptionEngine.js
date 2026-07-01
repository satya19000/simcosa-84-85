"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingTranscriptionEngine = void 0;
const uuid_1 = require("uuid");
const MeetingLogger_1 = require("./MeetingLogger");
const TRANSCRIPTS_COL = (tenantId) => `tenants/${tenantId}/meetingTranscripts`;
class MeetingTranscriptionEngine {
    constructor(db) {
        this.db = db;
        this.logger = new MeetingLogger_1.MeetingLogger();
    }
    /**
     * Add a finalized transcript chunk to Firestore.
     * This is REAL — chunk is persisted.
     *
     * PRIVACY: we do NOT log the text content here.
     */
    async addTranscriptChunk(input) {
        const transcriptId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const chunk = {
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
        };
        await this.db.collection(TRANSCRIPTS_COL(input.tenantId)).doc(transcriptId).set(chunk);
        // Log event without transcript content
        this.logger.log('transcript_added', input.sessionId, `chunkIndex=${input.chunkIndex}`);
        return chunk;
    }
    /**
     * Retrieve all transcript chunks for a session, ordered by chunkIndex.
     */
    async getTranscriptChunks(tenantId, sessionId) {
        const snap = await this.db
            .collection(TRANSCRIPTS_COL(tenantId))
            .where('sessionId', '==', sessionId)
            .orderBy('chunkIndex', 'asc')
            .get();
        return snap.docs.map((d) => d.data());
    }
    /**
     * Correct an existing transcript chunk.
     */
    async correctChunk(tenantId, transcriptId, correctedText) {
        await this.db.collection(TRANSCRIPTS_COL(tenantId)).doc(transcriptId).update({
            text: correctedText,
            status: 'finalized',
        });
    }
    /**
     * Delete a transcript chunk (requires consent audit before calling this).
     */
    async deleteChunk(tenantId, transcriptId) {
        await this.db.collection(TRANSCRIPTS_COL(tenantId)).doc(transcriptId).delete();
    }
    /**
     * Delete all transcript chunks for a session.
     * Requires audit trail — caller must invoke MeetingConsentManager.auditTranscriptDeleted first.
     */
    async deleteAllChunks(tenantId, sessionId) {
        const snap = await this.db
            .collection(TRANSCRIPTS_COL(tenantId))
            .where('sessionId', '==', sessionId)
            .get();
        const batch = this.db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        this.logger.log('transcript_deleted', sessionId, `count=${snap.docs.length}`);
        return snap.docs.length;
    }
    /**
     * Assemble all chunks into a full transcript string.
     * Used internally by summary engine — not exposed directly.
     */
    async assembleFullTranscript(tenantId, sessionId) {
        const chunks = await this.getTranscriptChunks(tenantId, sessionId);
        return chunks.map((c) => c.text).join('\n');
    }
    // ── Placeholder capabilities ──────────────────────────────────────────────
    /**
     * Live partial transcript — placeholder.
     * Browser Web Speech API can only be called from frontend browser context.
     * Backend cannot access microphone directly.
     */
    getLivePartialTranscript() {
        return {
            success: false,
            notImplemented: true,
            reason: 'Live partial transcript requires browser Web Speech API running in the frontend. The backend cannot capture audio.',
        };
    }
    /**
     * Speaker label detection — placeholder.
     */
    getSpeakerLabel() {
        return {
            success: false,
            notImplemented: true,
            reason: 'Speaker diarization requires a real-time STT provider integration (e.g., AssemblyAI, Deepgram). Not yet implemented.',
        };
    }
    /**
     * Language detection — placeholder.
     */
    detectLanguage() {
        return {
            success: false,
            notImplemented: true,
            reason: 'Automatic language detection requires a streaming STT provider. Not yet implemented.',
        };
    }
}
exports.MeetingTranscriptionEngine = MeetingTranscriptionEngine;
//# sourceMappingURL=MeetingTranscriptionEngine.js.map