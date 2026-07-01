/**
 * MeetingTypes.ts — canonical types for the Meeting Agent module.
 *
 * SAFETY NOTE: No auto-send, no stealth recording, no auto-task creation.
 * All communication actions require explicit approval via MeetingApprovalBridge.
 */

export type MeetingType =
  | 'voiceNote'
  | 'phoneCallNote'
  | 'onlineMeeting'
  | 'physicalMeeting'
  | 'consultation'
  | 'reviewMeeting'
  | 'publicHealthMeeting'
  | 'custom'

export type MeetingStatus =
  | 'draft'
  | 'consentRequired'
  | 'active'
  | 'paused'
  | 'ended'
  | 'processing'
  | 'summarized'
  | 'archived'
  | 'deleted'

export type ConsentStatus = 'notRequired' | 'pending' | 'granted' | 'denied' | 'revoked'

export type TranscriptChunkStatus = 'partial' | 'finalized'

export type ActionItemType =
  | 'task'
  | 'reminder'
  | 'followUp'
  | 'callToMake'
  | 'emailToSend'
  | 'messageToSend'
  | 'documentToPrepare'
  | 'approvalNeeded'
  | 'deadline'

export type ExportFormat = 'docx' | 'pdf' | 'markdown' | 'plaintext'

export interface MeetingParticipant {
  participantId: string
  sessionId: string
  tenantId: string
  userId?: string       // set if ARIA user
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
  platform?: string       // for online meetings
  recordingEnabled: boolean
  transcriptionEnabled: boolean
  aiSummaryEnabled: boolean
  tags?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface TranscriptChunk {
  transcriptId: string
  sessionId: string
  tenantId: string
  userId: string
  text: string
  speakerLabel?: string
  startMs?: number
  endMs?: number
  confidence?: number
  language?: string
  status: TranscriptChunkStatus
  chunkIndex: number
  createdAt: string
}

export interface MeetingSummary {
  summaryId: string
  sessionId: string
  tenantId: string
  userId: string
  shortSummary: string
  executiveSummary: string
  decisionsMade: string[]
  actionItems: string[]      // brief list; full items in MeetingActionItem
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

export interface MeetingAuditEvent {
  auditId: string
  sessionId: string
  tenantId: string
  userId: string
  event:
    | 'meeting_created'
    | 'recording_started'
    | 'recording_paused'
    | 'recording_stopped'
    | 'transcription_started'
    | 'transcription_stopped'
    | 'transcript_added'
    | 'transcript_deleted'
    | 'consent_granted'
    | 'consent_denied'
    | 'consent_revoked'
    | 'summary_generated'
    | 'action_items_extracted'
    | 'approval_requested'
    | 'follow_up_drafted'
    | 'export_requested'
    | 'meeting_ended'
    | 'meeting_archived'
    | 'meeting_deleted'
  detail?: string    // non-sensitive detail only
  createdAt: string
}

export interface MeetingFollowUp {
  followUpId: string
  sessionId: string
  tenantId: string
  userId: string
  type: 'emailSummary' | 'whatsappFollowUp' | 'smsReminder' | 'participantNote'
  recipientName?: string
  recipientEmail?: string
  recipientPhone?: string
  draftContent: string
  approvalStatus: 'draft' | 'approvalRequested' | 'approved' | 'sent' | 'rejected'
  approvalRequestId?: string
  createdAt: string
  updatedAt: string
}
