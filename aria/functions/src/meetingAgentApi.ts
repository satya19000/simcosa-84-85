/**
 * meetingAgentApi.ts — Cloud Functions for the Meeting Agent module.
 *
 * All functions verify request.auth + TenantEngine.requireIdentity
 * (the latter is enforced inside MeetingAgentEngine methods).
 *
 * Pattern mirrors computerControlApi.ts exactly.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { getMeetingAgentEngine } from './meeting-agent'
import { getApprovalEngine } from './delegation'
import { getAIGateway } from './ai-gateway'
import { TenantEngine } from './security/TenantEngine'
import type { MeetingType, ExportFormat } from './meeting-agent/MeetingTypes'

const SHARED_OPTS = {
  secrets: ['ANTHROPIC_API_KEY'],
  timeoutSeconds: 60,
}

function db(): admin.firestore.Firestore {
  return admin.firestore()
}

function apiKey(): string {
  return process.env.ANTHROPIC_API_KEY ?? ''
}

function requireAuth(request: { auth?: { uid: string } | null }): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.')
  return request.auth.uid
}

function wrapError<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch((err) => {
    const message = err instanceof Error ? err.message : 'Operation failed'
    if (message.includes('Access denied') || message.includes('no identity')) {
      throw new HttpsError('permission-denied', message)
    }
    if (
      message.includes('STEALTH_RECORDING_BLOCKED') ||
      message.includes('HIDDEN_MICROPHONE_BLOCKED') ||
      message.includes('BACKGROUND_LISTENING_BLOCKED') ||
      message.includes('AUTO_SEND_BLOCKED') ||
      message.includes('APPROVAL_BYPASS_BLOCKED')
    ) {
      throw new HttpsError('permission-denied', message)
    }
    throw new HttpsError('failed-precondition', message)
  })
}

function getMeetingEngine(uid: string) {
  const firestore = db()
  const key = apiKey()
  const tenants = new TenantEngine(firestore)
  const approvalEngine = getApprovalEngine(uid, firestore, key)
  const aiGateway = getAIGateway(uid, firestore, { anthropicApiKey: key, openaiApiKey: '', geminiApiKey: '', openrouterApiKey: '', localLlmEndpoint: null })
  return getMeetingAgentEngine(uid, firestore, tenants, approvalEngine, aiGateway, key)
}

// ── Session management ────────────────────────────────────────────────────

export const createMeetingSession = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, title, type, language, location, platform, tags, notes } = request.data as {
    tenantId: string
    title: string
    type: MeetingType
    language?: string
    location?: string
    platform?: string
    tags?: string[]
    notes?: string
  }
  if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  if (!title?.trim()) throw new HttpsError('invalid-argument', 'title required')
  if (!type) throw new HttpsError('invalid-argument', 'type required')
  const engine = getMeetingEngine(uid)
  return wrapError(() => engine.createSession(uid, { tenantId, title, type, language, location, platform, tags, notes }))
})

export const startMeetingSession = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, sessionId } = request.data as { tenantId: string; sessionId: string }
  if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  if (!sessionId?.trim()) throw new HttpsError('invalid-argument', 'sessionId required')
  const engine = getMeetingEngine(uid)
  return wrapError(() => engine.startSession(uid, tenantId, sessionId))
})

export const pauseMeetingSession = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, sessionId } = request.data as { tenantId: string; sessionId: string }
  if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  if (!sessionId?.trim()) throw new HttpsError('invalid-argument', 'sessionId required')
  const engine = getMeetingEngine(uid)
  return wrapError(() => engine.pauseSession(uid, tenantId, sessionId))
})

export const endMeetingSession = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, sessionId } = request.data as { tenantId: string; sessionId: string }
  if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  if (!sessionId?.trim()) throw new HttpsError('invalid-argument', 'sessionId required')
  const engine = getMeetingEngine(uid)
  return wrapError(() => engine.endSession(uid, tenantId, sessionId))
})

export const deleteMeetingSession = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, sessionId } = request.data as { tenantId: string; sessionId: string }
  if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  if (!sessionId?.trim()) throw new HttpsError('invalid-argument', 'sessionId required')
  const engine = getMeetingEngine(uid)
  return wrapError(() => engine.deleteSession(uid, tenantId, sessionId))
})

export const listMeetingSessions = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, limit } = request.data as { tenantId: string; limit?: number }
  if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  const engine = getMeetingEngine(uid)
  return wrapError(() => engine.listSessions(uid, tenantId, limit))
})

// ── Transcription ─────────────────────────────────────────────────────────

export const addTranscriptChunk = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, sessionId, text, chunkIndex, speakerLabel, startMs, endMs, confidence, language } = request.data as {
    tenantId: string
    sessionId: string
    text: string
    chunkIndex: number
    speakerLabel?: string
    startMs?: number
    endMs?: number
    confidence?: number
    language?: string
  }
  if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  if (!sessionId?.trim()) throw new HttpsError('invalid-argument', 'sessionId required')
  if (!text?.trim()) throw new HttpsError('invalid-argument', 'text required')
  const engine = getMeetingEngine(uid)
  return wrapError(() =>
    engine.addTranscriptChunk(uid, { tenantId, sessionId, text, chunkIndex, speakerLabel, startMs, endMs, confidence, language })
  )
})

// ── Summary & action items ────────────────────────────────────────────────

export const generateMeetingSummary = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, sessionId } = request.data as { tenantId: string; sessionId: string }
  if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  if (!sessionId?.trim()) throw new HttpsError('invalid-argument', 'sessionId required')
  const engine = getMeetingEngine(uid)
  return wrapError(() => engine.generateSummary(uid, tenantId, sessionId))
})

export const getMeetingSummary = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, sessionId } = request.data as { tenantId: string; sessionId: string }
  if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  if (!sessionId?.trim()) throw new HttpsError('invalid-argument', 'sessionId required')
  const engine = getMeetingEngine(uid)
  return wrapError(() => engine.getMeetingSummary(uid, tenantId, sessionId))
})

export const extractMeetingActionItems = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, sessionId } = request.data as { tenantId: string; sessionId: string }
  if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  if (!sessionId?.trim()) throw new HttpsError('invalid-argument', 'sessionId required')
  const engine = getMeetingEngine(uid)
  return wrapError(() => engine.extractActionItems(uid, tenantId, sessionId))
})

// ── Approval & export ─────────────────────────────────────────────────────

export const approveMeetingFollowUp = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, sessionId, followUpId } = request.data as {
    tenantId: string
    sessionId: string
    followUpId: string
  }
  if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  if (!sessionId?.trim()) throw new HttpsError('invalid-argument', 'sessionId required')
  if (!followUpId?.trim()) throw new HttpsError('invalid-argument', 'followUpId required')
  const engine = getMeetingEngine(uid)
  return wrapError(() => engine.approveMeetingFollowUp(uid, tenantId, sessionId, followUpId))
})

export const exportMeetingNotes = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, sessionId, format } = request.data as {
    tenantId: string
    sessionId: string
    format: ExportFormat
  }
  if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  if (!sessionId?.trim()) throw new HttpsError('invalid-argument', 'sessionId required')
  if (!format) throw new HttpsError('invalid-argument', 'format required')
  const engine = getMeetingEngine(uid)
  return wrapError(() => engine.exportMeetingNotes(uid, tenantId, sessionId, format))
})
