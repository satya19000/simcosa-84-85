import type * as admin from 'firebase-admin'
import type { CommunicationStats, CommunicationMessage, ProviderType } from './CommunicationTypes'

const MESSAGES_COL = (userId: string) => `users/${userId}/conversationMessages`
const THREADS_COL = (userId: string) => `users/${userId}/conversationThreads`

export class CommunicationAnalytics {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async getStats(userId: string): Promise<CommunicationStats> {
    const now = Date.now()
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [msgSnap, threadSnap, recentSnap, unreadSnap] = await Promise.all([
      this.db.collection(MESSAGES_COL(userId)).limit(5000).get(),
      this.db.collection(THREADS_COL(userId)).where('status', '!=', 'deleted').count().get(),
      this.db.collection(MESSAGES_COL(userId)).where('receivedAt', '>=', sevenDaysAgo).count().get(),
      this.db.collection(THREADS_COL(userId)).where('unreadCount', '>', 0).count().get(),
    ])

    const byProvider: Record<string, number> = {}
    const participantCounts: Record<string, number> = {}
    let inbound = 0
    let outbound = 0

    for (const doc of msgSnap.docs) {
      const msg = doc.data() as CommunicationMessage
      byProvider[msg.providerType] = (byProvider[msg.providerType] ?? 0) + 1
      if (msg.direction === 'inbound') {
        inbound++
        participantCounts[msg.from.name] = (participantCounts[msg.from.name] ?? 0) + 1
      } else {
        outbound++
      }
    }

    const topParticipants = Object.entries(participantCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    return {
      totalMessages: msgSnap.size,
      totalThreads: threadSnap.data().count,
      byProvider: byProvider as Record<ProviderType, number>,
      byDirection: { inbound, outbound },
      unreadCount: unreadSnap.data().count,
      topParticipants,
      recentActivity: recentSnap.data().count,
    }
  }

  async getThreadActivity(userId: string, days = 30): Promise<Array<{ date: string; count: number }>> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const snap = await this.db
      .collection(MESSAGES_COL(userId))
      .where('receivedAt', '>=', since)
      .get()

    const byDate: Record<string, number> = {}
    for (const doc of snap.docs) {
      const msg = doc.data() as CommunicationMessage
      const date = msg.receivedAt.slice(0, 10)
      byDate[date] = (byDate[date] ?? 0) + 1
    }

    return Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }))
  }
}
