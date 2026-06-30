import type * as admin from 'firebase-admin'
import type { ConversationThread, CommunicationMessage, ProviderType } from './CommunicationTypes'
import { v4 as uuidv4 } from 'uuid'

const THREADS_COL = (userId: string) => `users/${userId}/conversationThreads`
const MESSAGES_COL = (userId: string) => `users/${userId}/conversationMessages`

export class ConversationThreadStore {
  constructor(private readonly db: admin.firestore.Firestore) {}

  // ── Thread operations ────────────────────────────────────────────────────

  async createThread(
    userId: string,
    fields: Omit<ConversationThread, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<ConversationThread> {
    const now = new Date().toISOString()
    const thread: ConversationThread = {
      ...fields,
      id: uuidv4(),
      userId,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(THREADS_COL(userId)).doc(thread.id).set(thread)
    return thread
  }

  async getThread(userId: string, threadId: string): Promise<ConversationThread | null> {
    const snap = await this.db.collection(THREADS_COL(userId)).doc(threadId).get()
    return snap.exists ? (snap.data() as ConversationThread) : null
  }

  async updateThread(userId: string, threadId: string, patch: Partial<ConversationThread>): Promise<void> {
    await this.db.collection(THREADS_COL(userId)).doc(threadId).set(
      { ...patch, updatedAt: new Date().toISOString() },
      { merge: true }
    )
  }

  async deleteThread(userId: string, threadId: string): Promise<void> {
    await this.updateThread(userId, threadId, { status: 'deleted' })
  }

  async listThreads(
    userId: string,
    opts: { limit?: number; providerType?: ProviderType; status?: string } = {}
  ): Promise<ConversationThread[]> {
    let query: admin.firestore.Query = this.db
      .collection(THREADS_COL(userId))
      .where('status', '!=', 'deleted')

    if (opts.providerType) query = query.where('providerType', '==', opts.providerType)
    if (opts.status && opts.status !== 'deleted') query = query.where('status', '==', opts.status)

    const snap = await query.orderBy('lastMessageAt', 'desc').limit(opts.limit ?? 100).get()
    return snap.docs.map((d) => d.data() as ConversationThread)
  }

  async findByProviderThreadId(
    userId: string, providerId: string, providerThreadId: string
  ): Promise<ConversationThread | null> {
    const snap = await this.db
      .collection(THREADS_COL(userId))
      .where('providerId', '==', providerId)
      .where('providerThreadId', '==', providerThreadId)
      .limit(1)
      .get()
    if (snap.empty) return null
    return snap.docs[0]!.data() as ConversationThread
  }

  async countUnread(userId: string): Promise<number> {
    const snap = await this.db
      .collection(THREADS_COL(userId))
      .where('unreadCount', '>', 0)
      .where('status', '==', 'active')
      .count()
      .get()
    return snap.data().count
  }

  // ── Message operations ───────────────────────────────────────────────────

  async saveMessage(message: CommunicationMessage): Promise<void> {
    await this.db.collection(MESSAGES_COL(message.userId)).doc(message.id).set(message)
    // Update thread stats
    await this.db.collection(THREADS_COL(message.userId)).doc(message.threadId).set(
      {
        lastMessageAt: message.receivedAt,
        lastMessagePreview: message.body.slice(0, 120),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
  }

  async getMessages(userId: string, threadId: string, limit = 50): Promise<CommunicationMessage[]> {
    const snap = await this.db
      .collection(MESSAGES_COL(userId))
      .where('threadId', '==', threadId)
      .orderBy('receivedAt', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map((d) => d.data() as CommunicationMessage).reverse()
  }

  async getMessage(userId: string, messageId: string): Promise<CommunicationMessage | null> {
    const snap = await this.db.collection(MESSAGES_COL(userId)).doc(messageId).get()
    return snap.exists ? (snap.data() as CommunicationMessage) : null
  }

  async markRead(userId: string, threadId: string): Promise<void> {
    await this.db.collection(THREADS_COL(userId)).doc(threadId).set(
      { unreadCount: 0, updatedAt: new Date().toISOString() },
      { merge: true }
    )
  }

  async searchMessages(userId: string, query: string, limit = 20): Promise<CommunicationMessage[]> {
    const snap = await this.db
      .collection(MESSAGES_COL(userId))
      .orderBy('receivedAt', 'desc')
      .limit(2000)
      .get()
    const lower = query.toLowerCase()
    return snap.docs
      .map((d) => d.data() as CommunicationMessage)
      .filter((m) => m.body.toLowerCase().includes(lower) || (m.subject ?? '').toLowerCase().includes(lower))
      .slice(0, limit)
  }
}
