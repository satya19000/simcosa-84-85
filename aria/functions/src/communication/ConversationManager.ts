import type * as admin from 'firebase-admin'
import type {
  CommunicationMessage,
  ConversationThread,
  ThreadAnalysis,
  ConversationSummary,
  GeneratedReply,
  ProviderType,
  ProviderSendOptions,
  SummaryType,
  ReplyTone,
} from './CommunicationTypes'
import type { CommunicationConfig } from './CommunicationConfig'
import { ConversationThreadStore } from './ConversationThread'
import { ConversationMemory } from './ConversationMemory'
import { CommunicationRouter } from './CommunicationRouter'
import { CommunicationRegistry } from './CommunicationRegistry'
import { CommunicationEvents } from './CommunicationEvents'
import { getMemoryGraph } from '../memory-graph'
import { v4 as uuidv4 } from 'uuid'

export class ConversationManager {
  private readonly threadStore: ConversationThreadStore
  private readonly memory: ConversationMemory
  private readonly router: CommunicationRouter

  constructor(
    private readonly db: admin.firestore.Firestore,
    config: CommunicationConfig,
    private readonly registry: CommunicationRegistry,
    private readonly apiKey: string
  ) {
    this.threadStore = new ConversationThreadStore(db)
    this.memory = new ConversationMemory(db)
    this.router = new CommunicationRouter(
      config,
      this.apiKey,
      config.analysisBudgetTokens,
      config.summaryBudgetTokens,
      config.replyBudgetTokens
    )
  }

  // ── Message Ingestion ──────────────────────────────────────────────────────

  async ingestMessage(userId: string, message: CommunicationMessage): Promise<ConversationThread> {
    // Find or create thread
    let thread = await this.threadStore.findByProviderThreadId(
      userId, message.providerId, message.providerThreadId ?? message.id
    )

    if (!thread) {
      thread = await this.threadStore.createThread(userId, {
        providerId: message.providerId,
        providerType: message.providerType,
        providerThreadId: message.providerThreadId ?? message.id,
        subject: message.subject,
        participants: [message.from, ...message.to],
        lastMessageAt: message.receivedAt,
        lastMessagePreview: message.body.slice(0, 120),
        messageCount: 0,
        unreadCount: message.direction === 'inbound' ? 1 : 0,
        status: 'active',
        labels: message.labels,
        starred: message.starred,
      })
    } else {
      await this.threadStore.updateThread(userId, thread.id, {
        lastMessageAt: message.receivedAt,
        lastMessagePreview: message.body.slice(0, 120),
        messageCount: (thread.messageCount ?? 0) + 1,
        unreadCount: message.direction === 'inbound' ? (thread.unreadCount ?? 0) + 1 : thread.unreadCount,
      })
    }

    message.threadId = thread.id
    if (!message.id) message.id = uuidv4()
    await this.threadStore.saveMessage(message)

    // Record communication style
    if (message.direction === 'inbound') {
      for (const participant of [message.from]) {
        if (participant.contactId) {
          await this.memory.recordInteraction(userId, participant.contactId, message.providerType)
        }
      }
    }

    void CommunicationEvents.emit('message:received', userId, { messageId: message.id, threadId: thread.id })
    return thread
  }

  // ── Send Message ───────────────────────────────────────────────────────────

  async sendMessage(
    userId: string,
    providerId: string,
    opts: ProviderSendOptions
  ): Promise<CommunicationMessage> {
    const provider = this.registry.getProvider(providerId)
    if (!provider) throw new Error(`Provider "${providerId}" not found`)

    const message = await provider.send(userId, opts)
    message.userId = userId
    message.direction = 'outbound'
    if (!message.id) message.id = uuidv4()
    if (!message.receivedAt) message.receivedAt = new Date().toISOString()

    const thread = await this.ingestMessage(userId, message)
    void CommunicationEvents.emit('message:sent', userId, { messageId: message.id, threadId: thread.id })
    return message
  }

  // ── Thread Operations ──────────────────────────────────────────────────────

  async getThread(userId: string, threadId: string): Promise<ConversationThread | null> {
    return this.threadStore.getThread(userId, threadId)
  }

  async listThreads(
    userId: string,
    opts: { limit?: number; providerType?: ProviderType; status?: string } = {}
  ): Promise<ConversationThread[]> {
    return this.threadStore.listThreads(userId, opts)
  }

  async getMessages(userId: string, threadId: string, limit = 50): Promise<CommunicationMessage[]> {
    return this.threadStore.getMessages(userId, threadId, limit)
  }

  async markRead(userId: string, threadId: string): Promise<void> {
    return this.threadStore.markRead(userId, threadId)
  }

  async archiveThread(userId: string, threadId: string): Promise<void> {
    await this.threadStore.updateThread(userId, threadId, { status: 'archived' })
    void CommunicationEvents.emit('thread:archived', userId, { threadId })
  }

  // ── Intelligence ───────────────────────────────────────────────────────────

  async analyzeThread(userId: string, threadId: string): Promise<ThreadAnalysis> {
    const thread = await this.threadStore.getThread(userId, threadId)
    if (!thread) throw new Error('Thread not found')
    const messages = await this.threadStore.getMessages(userId, threadId, 30)
    const analysis = await this.router.analyzeThread(thread, messages)

    // Persist analysis
    await this.db.collection(`users/${userId}/threadAnalysis`).doc(threadId).set(analysis)

    // Link thread to memory graph
    await this.linkThreadToMemory(userId, thread, analysis)

    void CommunicationEvents.emit('analysis:complete', userId, { threadId, suggestionCount: analysis.suggestions.length })
    return analysis
  }

  async generateSummary(userId: string, threadId: string, type: SummaryType = 'thread'): Promise<ConversationSummary> {
    const thread = await this.threadStore.getThread(userId, threadId)
    if (!thread) throw new Error('Thread not found')
    const messages = await this.threadStore.getMessages(userId, threadId, 50)
    const summary = await this.router.generateSummary(thread, messages, type)

    await this.db.collection(`users/${userId}/conversationSummaries`).doc(summary.id).set(summary)
    return summary
  }

  async generateReply(userId: string, messageId: string, tone: ReplyTone): Promise<GeneratedReply> {
    const message = await this.threadStore.getMessage(userId, messageId)
    if (!message) throw new Error('Message not found')
    const thread = await this.threadStore.getThread(userId, message.threadId)
    if (!thread) throw new Error('Thread not found')
    return this.router.generateReply(message, thread, tone)
  }

  // ── Sync ──────────────────────────────────────────────────────────────────

  async syncProvider(userId: string, providerId: string): Promise<number> {
    const provider = this.registry.getProvider(providerId)
    if (!provider) throw new Error(`Provider "${providerId}" not found`)
    return provider.sync(userId)
  }

  // ── Memory Graph Integration ───────────────────────────────────────────────

  private async linkThreadToMemory(userId: string, thread: ConversationThread, analysis: ThreadAnalysis): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)

      const { node: threadNode } = await graph.upsertNode(
        'conversation',
        thread.subject ?? `${thread.providerType} conversation`,
        `${thread.providerType} thread with ${thread.participants.length} participants`,
        {
          threadId: thread.id,
          providerType: thread.providerType,
          messageCount: thread.messageCount,
          topics: analysis.topics,
        },
        35
      )

      for (const participant of thread.participants) {
        if (!participant.name) continue
        const { node: personNode } = await graph.upsertNode(
          'person',
          participant.name,
          `Participant in ${thread.providerType} thread`,
          { address: participant.address, contactId: participant.contactId },
          50
        )
        await graph.upsertEdge(personNode.id, threadNode.id, 'ATTENDED', {
          weight: 0.7,
          confidence: 0.8,
        })
      }
    } catch {
      // Memory linking is best-effort
    }
  }
}
