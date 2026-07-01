/**
 * meetingAgentService.ts — frontend service for the Meeting Agent module.
 *
 * Calls Cloud Functions only — no direct API keys, no direct provider calls.
 * Mirrors computerControlService.ts pattern exactly.
 */

import { httpsCallable } from 'firebase/functions'
import { functions as fns } from './firebase'

const createMeetingSessionFn = httpsCallable(fns, 'createMeetingSession')
const startMeetingSessionFn = httpsCallable(fns, 'startMeetingSession')
const pauseMeetingSessionFn = httpsCallable(fns, 'pauseMeetingSession')
const endMeetingSessionFn = httpsCallable(fns, 'endMeetingSession')
const deleteMeetingSessionFn = httpsCallable(fns, 'deleteMeetingSession')
const listMeetingSessionsFn = httpsCallable(fns, 'listMeetingSessions')
const addTranscriptChunkFn = httpsCallable(fns, 'addTranscriptChunk')
const generateMeetingSummaryFn = httpsCallable(fns, 'generateMeetingSummary', { timeout: 120000 })
const getMeetingSummaryFn = httpsCallable(fns, 'getMeetingSummary')
const extractMeetingActionItemsFn = httpsCallable(fns, 'extractMeetingActionItems', { timeout: 60000 })
const approveMeetingFollowUpFn = httpsCallable(fns, 'approveMeetingFollowUp')
const exportMeetingNotesFn = httpsCallable(fns, 'exportMeetingNotes')

// ── Types (mirrors MeetingTypes.ts) ──────────────────────────────────────

export type MeetingType =
  | 'voiceNote' | 'phoneCallNote' | 'onlineMeeting' | 'physicalMeeting'
  | 'consultation' | 'reviewMeeting' | 'publicHealthMeeting' | 'custom'

export type MeetingStatus =
  | 'draft' | 'consentRequired' | 'active' | 'paused' | 'ended'
  | 'processing' | 'summarized' | 'archived' | 'deleted'

export type ConsentStatus = 'notRequired' | 'pending' | 'granted' | 'denied' | 'revoked'

export type ExportFormat = 'docx' | 'pdf' | 'markdown' | 'plaintext'

export interface MeetingParticipant {
  participantId: string
  sessionId: string
  tenantId: string
  userId?: string
  name: string
  email?: string
  phone?: string
  role?: string
  consentStatus: ConsentStatus
  consentNotes?: string
  joinedAt: string
  leftAt?: string
  createdAt: string
  updatedAt: string
}

export interface MeetingSession {
  sessionId: string
  userId: string
  tenantId: string
  title: string
  type: MeetingType
  participants: MeetingParticipant[]
  consentStatus: ConsentStatus
  startedAt?: string
  endedAt?: string
  status: MeetingStatus
  language?: string
  location?: string
  platform?: string
  recordingEnabled: boolean
  transcriptionEnabled: boolean
  aiSummaryEnabled: boolean
  tags?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MeetingSummary {
  summaryId: string
  sessionId: string
  tenantId: string
  userId: string
  shortSummary: string
  executiveSummary: string
  decisionsMade: string[]
  actionItems: string[]
  deadlines: string[]
  risks: string[]
  pendingQuestions: string[]
  peopleMentioned: string[]
  documentsMentioned: string[]
  followUpRecommendations: string[]
  generatedByAI: boolean
  modelUsed?: string
  createdAt: string
  updatedAt: string
}

export type ActionItemType =
  | 'task' | 'reminder' | 'followUp' | 'callToMake' | 'emailToSend'
  | 'messageToSend' | 'documentToPrepare' | 'approvalNeeded' | 'deadline'

export interface MeetingActionItem {
  actionItemId: string
  sessionId: string
  tenantId: string
  userId: string
  type: ActionItemType
  description: string
  assignee?: string
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
  approvalStatus: 'suggestion' | 'approvalRequested' | 'approved' | 'rejected' | 'created'
  approvalRequestId?: string
  extractedFromText?: string
  createdAt: string
  updatedAt: string
}

// ── API functions ─────────────────────────────────────────────────────────

export async function createMeetingSession(input: {
  tenantId: string
  title: string
  type: MeetingType
  language?: string
  location?: string
  platform?: string
  tags?: string[]
  notes?: string
}): Promise<MeetingSession> {
  const res = await createMeetingSessionFn(input)
  return res.data as MeetingSession
}

export async function startMeetingSession(tenantId: string, sessionId: string): Promise<MeetingSession> {
  const res = await startMeetingSessionFn({ tenantId, sessionId })
  return res.data as MeetingSession
}

export async function pauseMeetingSession(tenantId: string, sessionId: string): Promise<MeetingSession> {
  const res = await pauseMeetingSessionFn({ tenantId, sessionId })
  return res.data as MeetingSession
}

export async function endMeetingSession(tenantId: string, sessionId: string): Promise<MeetingSession> {
  const res = await endMeetingSessionFn({ tenantId, sessionId })
  return res.data as MeetingSession
}

export async function deleteMeetingSession(tenantId: string, sessionId: string): Promise<void> {
  await deleteMeetingSessionFn({ tenantId, sessionId })
}

export async function listMeetingSessions(tenantId: string, limit?: number): Promise<MeetingSession[]> {
  const res = await listMeetingSessionsFn({ tenantId, limit })
  return res.data as MeetingSession[]
}

export async function addTranscriptChunk(input: {
  tenantId: string
  sessionId: string
  text: string
  chunkIndex: number
  speakerLabel?: string
  startMs?: number
  endMs?: number
  confidence?: number
  language?: string
}): Promise<{ transcriptId: string }> {
  const res = await addTranscriptChunkFn(input)
  return res.data as { transcriptId: string }
}

export async function generateMeetingSummary(tenantId: string, sessionId: string): Promise<MeetingSummary> {
  const res = await generateMeetingSummaryFn({ tenantId, sessionId })
  return res.data as MeetingSummary
}

export async function getMeetingSummary(tenantId: string, sessionId: string): Promise<MeetingSummary | null> {
  const res = await getMeetingSummaryFn({ tenantId, sessionId })
  return res.data as MeetingSummary | null
}

export async function extractMeetingActionItems(tenantId: string, sessionId: string): Promise<MeetingActionItem[]> {
  const res = await extractMeetingActionItemsFn({ tenantId, sessionId })
  return res.data as MeetingActionItem[]
}

export async function approveMeetingFollowUp(tenantId: string, sessionId: string, followUpId: string): Promise<{ approvalRequestId: string }> {
  const res = await approveMeetingFollowUpFn({ tenantId, sessionId, followUpId })
  return res.data as { approvalRequestId: string }
}

export async function exportMeetingNotes(tenantId: string, sessionId: string, format: ExportFormat): Promise<{ content: string; mimeType: string; fileName: string; notImplemented?: boolean }> {
  const res = await exportMeetingNotesFn({ tenantId, sessionId, format })
  return res.data as { content: string; mimeType: string; fileName: string; notImplemented?: boolean }
}
