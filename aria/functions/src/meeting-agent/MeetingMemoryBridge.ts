/**
 * MeetingMemoryBridge.ts — links meeting sessions to the Memory Graph.
 *
 * Stores: meeting → participants → contacts → tasks → reminders →
 *         documents → approvals → follow-ups.
 * Transcript chunks are stored in Firestore (MeetingTranscriptionEngine),
 * not in the Memory Graph, to preserve privacy isolation.
 */

import { getMemoryGraph } from '../memory-graph'
import type * as admin from 'firebase-admin'
import type { MeetingSession, MeetingSummary } from './MeetingTypes'
import { MeetingLogger } from './MeetingLogger'

export class MeetingMemoryBridge {
  private readonly logger = new MeetingLogger()

  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly apiKey: string
  ) {}

  /**
   * Link a meeting session node to the Memory Graph.
   * Stores meeting metadata only — not raw transcript content.
   */
  async linkMeetingSession(userId: string, session: MeetingSession): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      await graph.upsertNode(
        'meeting',
        `Meeting: ${session.title}`,
        `${session.type} meeting on ${session.startedAt ?? session.createdAt}`,
        {
          sessionId: session.sessionId,
          tenantId: session.tenantId,
          type: session.type,
          status: session.status,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
        },
        0.5
      )
      this.logger.log('memory_meeting_linked', session.sessionId)
    } catch (err) {
      this.logger.error('memory_meeting_link_failed', session.sessionId, err)
    }
  }

  /**
   * Link a meeting summary to the Memory Graph.
   */
  async linkSummary(userId: string, session: MeetingSession, summary: MeetingSummary): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      // Link people mentioned
      for (const person of summary.peopleMentioned) {
        await graph.upsertNode('person', person, `Mentioned in meeting: ${session.title}`, {
          sessionId: session.sessionId,
        }, 0.5)
      }
      // Link documents mentioned
      for (const doc of summary.documentsMentioned) {
        await graph.upsertNode('document', doc, `Referenced in meeting: ${session.title}`, {
          sessionId: session.sessionId,
        }, 0.5)
      }
      this.logger.log('memory_summary_linked', session.sessionId)
    } catch (err) {
      this.logger.error('memory_summary_link_failed', session.sessionId, err)
    }
  }

  /**
   * Link a follow-up approval request to the Memory Graph.
   */
  async linkApprovalRequest(
    userId: string,
    sessionId: string,
    approvalRequestId: string,
    description: string
  ): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      await graph.upsertNode('task', `Approval: ${description}`, description, {
        sessionId,
        approvalRequestId,
        type: 'meetingApproval',
      }, 0.5)
      this.logger.log('memory_approval_linked', sessionId)
    } catch (err) {
      this.logger.error('memory_approval_link_failed', sessionId, err)
    }
  }
}
