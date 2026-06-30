import type * as admin from 'firebase-admin'
import type { CommunicationTemplate, MessageContentType, ProviderType } from './CommunicationTypes'
import { v4 as uuidv4 } from 'uuid'

const COL = (userId: string) => `users/${userId}/communicationTemplates`

export class CommunicationTemplates {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async create(
    userId: string,
    fields: Omit<CommunicationTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<CommunicationTemplate> {
    const now = new Date().toISOString()
    const template: CommunicationTemplate = {
      ...fields,
      id: uuidv4(),
      userId,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(COL(userId)).doc(template.id).set(template)
    return template
  }

  async get(userId: string, templateId: string): Promise<CommunicationTemplate | null> {
    const snap = await this.db.collection(COL(userId)).doc(templateId).get()
    return snap.exists ? (snap.data() as CommunicationTemplate) : null
  }

  async list(userId: string, providerType?: ProviderType): Promise<CommunicationTemplate[]> {
    let query: admin.firestore.Query = this.db.collection(COL(userId))
    if (providerType) query = query.where('providerType', '==', providerType)
    const snap = await query.orderBy('name').get()
    return snap.docs.map((d) => d.data() as CommunicationTemplate)
  }

  async update(userId: string, templateId: string, patch: Partial<CommunicationTemplate>): Promise<void> {
    await this.db.collection(COL(userId)).doc(templateId).set(
      { ...patch, updatedAt: new Date().toISOString() },
      { merge: true }
    )
  }

  async delete(userId: string, templateId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(templateId).delete()
  }

  /** Render a template by substituting {{variable}} placeholders. */
  render(template: CommunicationTemplate, vars: Record<string, string>): { subject?: string; body: string } {
    const substitute = (text: string) =>
      text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`)
    return {
      subject: template.subject ? substitute(template.subject) : undefined,
      body: substitute(template.body),
    }
  }

  /** Create built-in system templates for a new user. */
  async seedDefaults(userId: string): Promise<void> {
    const defaults: Array<{
      name: string; description: string; contentType: MessageContentType; body: string; variables: string[]; tags: string[]
    }> = [
      {
        name: 'Meeting Confirmation',
        description: 'Confirm a scheduled meeting',
        contentType: 'text',
        body: 'Dear {{name}},\n\nThis is to confirm our meeting scheduled for {{date}} at {{time}}.\n\nLooking forward to connecting.\n\nRegards',
        variables: ['name', 'date', 'time'],
        tags: ['meeting', 'formal'],
      },
      {
        name: 'Follow-up',
        description: 'Generic follow-up message',
        contentType: 'text',
        body: 'Dear {{name}},\n\nI wanted to follow up regarding {{topic}}. Please let me know if you need any further information.\n\nRegards',
        variables: ['name', 'topic'],
        tags: ['follow-up'],
      },
      {
        name: 'Out of Office',
        description: 'Automated out-of-office reply',
        contentType: 'text',
        body: 'Thank you for your message. I am currently out of office until {{returnDate}} and will respond upon my return.\n\nFor urgent matters, please contact {{contactName}} at {{contactEmail}}.',
        variables: ['returnDate', 'contactName', 'contactEmail'],
        tags: ['auto-reply', 'ooo'],
      },
    ]

    const existing = await this.list(userId)
    const existingNames = new Set(existing.map((t) => t.name))
    for (const d of defaults) {
      if (!existingNames.has(d.name)) {
        await this.create(userId, d)
      }
    }
  }
}
