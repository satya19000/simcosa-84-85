/**
 * MeetingValidator.ts — input validation for meeting agent operations.
 */

import type { MeetingType, MeetingSession } from './MeetingTypes'

const VALID_MEETING_TYPES: MeetingType[] = [
  'voiceNote', 'phoneCallNote', 'onlineMeeting', 'physicalMeeting',
  'consultation', 'reviewMeeting', 'publicHealthMeeting', 'custom',
]

export class MeetingValidator {
  validateCreateSession(input: {
    title?: unknown
    type?: unknown
    tenantId?: unknown
  }): void {
    if (!input.title || typeof input.title !== 'string' || !input.title.trim()) {
      throw new Error('title is required')
    }
    if (!input.type || !VALID_MEETING_TYPES.includes(input.type as MeetingType)) {
      throw new Error(`type must be one of: ${VALID_MEETING_TYPES.join(', ')}`)
    }
    if (!input.tenantId || typeof input.tenantId !== 'string' || !input.tenantId.trim()) {
      throw new Error('tenantId is required')
    }
  }

  validateTranscriptChunk(input: { text?: unknown; chunkIndex?: unknown }): void {
    if (!input.text || typeof input.text !== 'string' || !input.text.trim()) {
      throw new Error('transcript text is required')
    }
    if (typeof input.chunkIndex !== 'number' || input.chunkIndex < 0) {
      throw new Error('chunkIndex must be a non-negative number')
    }
  }

  validateSession(session: MeetingSession | null, sessionId: string): MeetingSession {
    if (!session) throw new Error(`Meeting session not found: ${sessionId}`)
    return session
  }

  validateActive(session: MeetingSession): void {
    if (session.status !== 'active') {
      throw new Error(`Session is not active (status: ${session.status})`)
    }
  }
}
