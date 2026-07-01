/**
 * MeetingConfig.ts — configuration types and defaults for the Meeting Agent.
 */

export interface MeetingConfig {
  /** Maximum transcript chunks stored per session */
  maxTranscriptChunksPerSession: number
  /** Maximum participants per session */
  maxParticipantsPerSession: number
  /** Whether AI summary is enabled by default */
  aiSummaryEnabledByDefault: boolean
  /** Whether recording is enabled by default */
  recordingEnabledByDefault: boolean
  /** Session TTL for in-memory cache (ms) */
  sessionTtlMs: number
  /** Whether to require participant consent for recording */
  requireParticipantConsent: boolean
  /** Org-level: require audit trail for transcript deletion */
  requireAuditForTranscriptDeletion: boolean
}

export const DEFAULT_MEETING_CONFIG: MeetingConfig = {
  maxTranscriptChunksPerSession: 10000,
  maxParticipantsPerSession: 500,
  aiSummaryEnabledByDefault: true,
  recordingEnabledByDefault: false,   // off by default — user must explicitly enable
  sessionTtlMs: 20 * 60 * 1000,
  requireParticipantConsent: true,
  requireAuditForTranscriptDeletion: true,
}
