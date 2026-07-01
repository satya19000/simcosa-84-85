/**
 * meeting-agent/index.ts — per-user singleton session + public re-exports.
 *
 * Follows the same singleton pattern as ai-gateway/index.ts and
 * computer-control/index.ts exactly.
 */

import type * as admin from 'firebase-admin'
import type { TenantEngine } from '../security/TenantEngine'
import type { ApprovalEngine } from '../delegation/ApprovalEngine'
import type { AIGateway } from '../ai-gateway/AIGateway'
import { MeetingAgentEngine } from './MeetingAgentEngine'
import { DEFAULT_MEETING_CONFIG } from './MeetingConfig'

// ── Per-user singleton sessions ───────────────────────────────────────────

interface Session {
  engine: MeetingAgentEngine
  createdAt: number
}

const sessions = new Map<string, Session>()
const SESSION_TTL_MS = 20 * 60 * 1000

export function getMeetingAgentEngine(
  userId: string,
  db: admin.firestore.Firestore,
  tenants: TenantEngine,
  approvalEngine: ApprovalEngine,
  aiGateway: AIGateway,
  apiKey: string
): MeetingAgentEngine {
  const existing = sessions.get(userId)
  if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS) return existing.engine

  const session: Session = {
    engine: new MeetingAgentEngine(db, tenants, approvalEngine, aiGateway, apiKey, DEFAULT_MEETING_CONFIG),
    createdAt: Date.now(),
  }
  sessions.set(userId, session)
  return session.engine
}

// ── Re-exports ────────────────────────────────────────────────────────────

export { MeetingAgentEngine } from './MeetingAgentEngine'
export { MeetingSessionManager } from './MeetingSessionManager'
export { MeetingTranscriptionEngine } from './MeetingTranscriptionEngine'
export { MeetingSummaryEngine } from './MeetingSummaryEngine'
export { MeetingActionExtractor } from './MeetingActionExtractor'
export { MeetingParticipantManager } from './MeetingParticipantManager'
export { MeetingConsentManager } from './MeetingConsentManager'
export { MeetingApprovalBridge } from './MeetingApprovalBridge'
export { MeetingPolicyEngine } from './MeetingPolicyEngine'
export { MeetingSafetyGuard, MeetingSafetyError } from './MeetingSafetyGuard'
export { MeetingNotesManager } from './MeetingNotesManager'
export { MeetingFollowUpManager } from './MeetingFollowUpManager'
export { MeetingWorkflowBridge } from './MeetingWorkflowBridge'
export { MeetingMemoryBridge } from './MeetingMemoryBridge'
export { MeetingCommunicationBridge } from './MeetingCommunicationBridge'
export { MeetingAnalytics } from './MeetingAnalytics'
export { MeetingEvents } from './MeetingEvents'
export { MeetingValidator } from './MeetingValidator'
export { MeetingLogger } from './MeetingLogger'
export { MeetingExportManager } from './MeetingExportManager'
export { DEFAULT_MEETING_CONFIG } from './MeetingConfig'
export type { MeetingConfig } from './MeetingConfig'
export type {
  MeetingSession, MeetingType, MeetingStatus, MeetingParticipant,
  TranscriptChunk, MeetingSummary, MeetingActionItem, MeetingAuditEvent,
  MeetingFollowUp, ConsentStatus, ActionItemType, ExportFormat,
} from './MeetingTypes'
