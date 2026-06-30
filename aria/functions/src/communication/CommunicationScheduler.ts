import type * as admin from 'firebase-admin'
import type { ScheduledMessage } from './CommunicationTypes'
import type { CommunicationRegistry } from './CommunicationRegistry'
import { v4 as uuidv4 } from 'uuid'

const COL = (userId: string) => `users/${userId}/scheduledMessages`

export class CommunicationScheduler {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly registry: CommunicationRegistry
  ) {}

  async schedule(
    userId: string,
    fields: Omit<ScheduledMessage, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<ScheduledMessage> {
    const now = new Date().toISOString()
    const msg: ScheduledMessage = {
      ...fields,
      id: uuidv4(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(COL(userId)).doc(msg.id).set(msg)
    return msg
  }

  async cancel(userId: string, messageId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(messageId).set(
      { status: 'cancelled', updatedAt: new Date().toISOString() },
      { merge: true }
    )
  }

  async listPending(userId: string): Promise<ScheduledMessage[]> {
    const snap = await this.db
      .collection(COL(userId))
      .where('status', '==', 'pending')
      .orderBy('scheduledFor')
      .get()
    return snap.docs.map((d) => d.data() as ScheduledMessage)
  }

  /** Process due messages across all users (called from a scheduled Cloud Function). */
  async processDue(userId: string): Promise<{ sent: number; failed: number }> {
    const now = new Date().toISOString()
    const snap = await this.db
      .collection(COL(userId))
      .where('status', '==', 'pending')
      .where('scheduledFor', '<=', now)
      .limit(50)
      .get()

    let sent = 0
    let failed = 0

    for (const doc of snap.docs) {
      const msg = doc.data() as ScheduledMessage
      const provider = this.registry.getProvider(msg.providerId)
      if (!provider) {
        await doc.ref.set({ status: 'failed', updatedAt: now }, { merge: true })
        failed++
        continue
      }
      try {
        await provider.send(userId, {
          to: msg.to,
          body: msg.body,
          subject: msg.subject,
          contentType: msg.contentType,
        })
        await doc.ref.set({ status: 'sent', updatedAt: now }, { merge: true })
        sent++
      } catch {
        await doc.ref.set({ status: 'failed', updatedAt: now }, { merge: true })
        failed++
      }
    }

    return { sent, failed }
  }
}
