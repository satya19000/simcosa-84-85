import Anthropic from '@anthropic-ai/sdk'
import type * as admin from 'firebase-admin'
import type {
  CommunicationSearchOptions,
  CommunicationSearchResult,
  CommunicationMessage,
  ConversationThread,
} from './CommunicationTypes'
import type { CommunicationConfig } from './CommunicationConfig'
import { ConversationThreadStore } from './ConversationThread'

export class CommunicationSearch {
  private readonly client: Anthropic
  private readonly threadStore: ConversationThreadStore

  constructor(
    db: admin.firestore.Firestore,
    config: CommunicationConfig,
    apiKey: string,
    private readonly searchLimit: number
  ) {
    this.client = new Anthropic({ apiKey })
    this.threadStore = new ConversationThreadStore(db)
    void config
  }

  async search(userId: string, opts: CommunicationSearchOptions): Promise<CommunicationSearchResult[]> {
    const scope = opts.scope ?? 'all'
    const limit = opts.limit ?? this.searchLimit
    const results: CommunicationSearchResult[] = []

    if (scope === 'all' || scope === 'messages') {
      const msgs = await this.searchMessages(userId, opts.query, limit)
      results.push(...msgs)
    }

    if (scope === 'all' || scope === 'threads') {
      const threads = await this.searchThreads(userId, opts.query, limit)
      results.push(...threads)
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  private async searchMessages(userId: string, query: string, limit: number): Promise<CommunicationSearchResult[]> {
    const messages = await this.threadStore.searchMessages(userId, query, limit)
    return messages.map((m: CommunicationMessage) => ({
      type: 'message' as const,
      id: m.id,
      threadId: m.threadId,
      title: m.subject ?? m.from.name,
      snippet: m.body.slice(0, 200),
      score: this.scoreMessage(m, query),
      providerType: m.providerType,
      date: m.receivedAt,
    }))
  }

  private async searchThreads(userId: string, query: string, limit: number): Promise<CommunicationSearchResult[]> {
    const threads = await this.threadStore.listThreads(userId, { limit: limit * 3 })
    const lower = query.toLowerCase()
    return threads
      .filter((t: ConversationThread) =>
        (t.subject ?? '').toLowerCase().includes(lower) ||
        t.lastMessagePreview.toLowerCase().includes(lower)
      )
      .slice(0, limit)
      .map((t: ConversationThread) => ({
        type: 'thread' as const,
        id: t.id,
        threadId: t.id,
        title: t.subject ?? `Thread with ${t.participants[0]?.name ?? 'Unknown'}`,
        snippet: t.lastMessagePreview,
        score: 0.6,
        providerType: t.providerType,
        date: t.lastMessageAt,
      }))
  }

  async semanticSearch(userId: string, query: string, limit = 10): Promise<CommunicationSearchResult[]> {
    const threads = await this.threadStore.listThreads(userId, { limit: 50 })
    if (threads.length === 0) return []

    const list = threads
      .slice(0, 30)
      .map((t: ConversationThread, i: number) => `${i}: ${t.subject ?? t.lastMessagePreview.slice(0, 80)}`)
      .join('\n')

    try {
      const response = await this.client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: `Find conversations most relevant to: "${query}"\n\nConversations:\n${list}\n\nReturn JSON array of indices (0-based): [0,3,7]`,
          },
        ],
      })
      const block = response.content.find((b) => b.type === 'text')
      const raw = block?.type === 'text' ? block.text : '[]'
      const match = raw.match(/\[[\s\S]*\]/)
      if (!match) return []
      const indices: number[] = JSON.parse(match[0])
      const mapped: Array<CommunicationSearchResult | null> = indices.map((i, rank) => {
        const t = threads[i]
        if (!t) return null
        return {
          type: 'thread' as const,
          id: t.id,
          threadId: t.id,
          title: t.subject ?? t.lastMessagePreview.slice(0, 60),
          snippet: t.lastMessagePreview,
          score: 0.95 - rank * 0.05,
          providerType: t.providerType,
          date: t.lastMessageAt,
        }
      })
      return mapped
        .filter((r): r is CommunicationSearchResult => r !== null)
        .slice(0, limit)
    } catch {
      return []
    }
  }

  private scoreMessage(msg: CommunicationMessage, query: string): number {
    const lower = query.toLowerCase()
    const inSubject = (msg.subject ?? '').toLowerCase().includes(lower)
    const inBody = msg.body.toLowerCase().includes(lower)
    return inSubject ? 0.9 : inBody ? 0.7 : 0.5
  }
}
