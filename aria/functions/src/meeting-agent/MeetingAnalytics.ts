/**
 * MeetingAnalytics.ts — lightweight analytics for meeting sessions.
 */

import type * as admin from 'firebase-admin'
import type { MeetingSession, MeetingStatus, MeetingType } from './MeetingTypes'

export interface MeetingStats {
  totalSessions: number
  byStatus: Record<MeetingStatus, number>
  byType: Record<MeetingType, number>
  averageDurationMs: number | null
  totalTranscriptChunks: number
}

export class MeetingAnalytics {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async getStats(tenantId: string, userId: string): Promise<MeetingStats> {
    const snap = await this.db
      .collection(`tenants/${tenantId}/meetingSessions`)
      .where('userId', '==', userId)
      .get()

    const sessions = snap.docs.map((d) => d.data() as MeetingSession)

    const byStatus = {} as Record<MeetingStatus, number>
    const byType = {} as Record<MeetingType, number>
    let totalDurationMs = 0
    let sessionsWithDuration = 0

    for (const session of sessions) {
      byStatus[session.status] = (byStatus[session.status] ?? 0) + 1
      byType[session.type] = (byType[session.type] ?? 0) + 1

      if (session.startedAt && session.endedAt) {
        const duration = new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()
        totalDurationMs += duration
        sessionsWithDuration++
      }
    }

    return {
      totalSessions: sessions.length,
      byStatus,
      byType,
      averageDurationMs: sessionsWithDuration > 0 ? totalDurationMs / sessionsWithDuration : null,
      totalTranscriptChunks: 0,   // would require a separate query; left as placeholder
    }
  }
}
