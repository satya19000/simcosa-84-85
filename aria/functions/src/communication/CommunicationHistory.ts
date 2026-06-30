import type * as admin from 'firebase-admin'
import type { CommunicationMessage, ConversationThread, ProviderType } from './CommunicationTypes'

const MESSAGES_COL = (userId: string) => `users/${userId}/conversationMessages`
const THREADS_COL = (userId: string) => `users/${userId}/conversationThreads`

export class CommunicationHistory {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async getRecentThreads(userId: string, limit = 20): Promise<ConversationThread[]> {
    const snap = await this.db
      .collection(THREADS_COL(userId))
      .where('status', '==', 'active')
      .orderBy('lastMessageAt', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map((d) => d.data() as ConversationThread)
  }

  async getThreadsByProvider(userId: string, providerType: ProviderType, limit = 50): Promise<ConversationThread[]> {
    const snap = await this.db
      .collection(THREADS_COL(userId))
      .where('providerType', '==', providerType)
      .where('status', '!=', 'deleted')
      .orderBy('lastMessageAt', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map((d) => d.data() as ConversationThread)
  }

  async getMessagesSince(userId: string, since: string, limit = 200): Promise<CommunicationMessage[]> {
    const snap = await this.db
      .collection(MESSAGES_COL(userId))
      .where('receivedAt', '>=', since)
      .orderBy('receivedAt', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map((d) => d.data() as CommunicationMessage)
  }

  async getMessagesByParticipant(userId: string, address: string, limit = 50): Promise<CommunicationMessage[]> {
    const snap = await this.db
      .collection(MESSAGES_COL(userId))
      .where('from.address', '==', address)
      .orderBy('receivedAt', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map((d) => d.data() as CommunicationMessage)
  }

  async countMessagesByProvider(userId: string): Promise<Record<string, number>> {
    const snap = await this.db
      .collection(MESSAGES_COL(userId))
      .limit(5000)
      .get()
    const counts: Record<string, number> = {}
    for (const doc of snap.docs) {
      const msg = doc.data() as CommunicationMessage
      counts[msg.providerType] = (counts[msg.providerType] ?? 0) + 1
    }
    return counts
  }

  async purgeOldMessages(userId: string, olderThanDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString()
    const snap = await this.db
      .collection(MESSAGES_COL(userId))
      .where('receivedAt', '<', cutoff)
      .limit(500)
      .get()
    const batch = this.db.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    return snap.size
  }
}
