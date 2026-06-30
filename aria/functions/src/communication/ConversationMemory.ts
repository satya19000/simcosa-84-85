import type * as admin from 'firebase-admin'
import type { ContactCommunicationStyle, ProviderType } from './CommunicationTypes'

const COL = (userId: string) => `users/${userId}/communicationMemory`

export class ConversationMemory {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async getStyle(userId: string, contactId: string): Promise<ContactCommunicationStyle | null> {
    const snap = await this.db.collection(COL(userId)).doc(contactId).get()
    return snap.exists ? (snap.data() as ContactCommunicationStyle) : null
  }

  async updateStyle(userId: string, contactId: string, patch: Partial<ContactCommunicationStyle>): Promise<void> {
    const existing = await this.getStyle(userId, contactId)
    const now = new Date().toISOString()
    const updated: ContactCommunicationStyle = {
      contactId,
      userId,
      interactionCount: 0,
      ...existing,
      ...patch,
      updatedAt: now,
    }
    await this.db.collection(COL(userId)).doc(contactId).set(updated)
  }

  async recordInteraction(
    userId: string,
    contactId: string,
    channel: ProviderType
  ): Promise<void> {
    const existing = await this.getStyle(userId, contactId)
    const count = (existing?.interactionCount ?? 0) + 1
    await this.updateStyle(userId, contactId, {
      preferredChannel: existing?.preferredChannel ?? channel,
      interactionCount: count,
      lastInteractionAt: new Date().toISOString(),
    })
  }

  async listAll(userId: string): Promise<ContactCommunicationStyle[]> {
    const snap = await this.db.collection(COL(userId)).orderBy('interactionCount', 'desc').limit(200).get()
    return snap.docs.map((d) => d.data() as ContactCommunicationStyle)
  }

  async delete(userId: string, contactId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(contactId).delete()
  }
}
