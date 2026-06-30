import type * as admin from 'firebase-admin'
import type {
  CommunicationMessage,
  ConversationThread,
  ThreadAnalysis,
  ConversationSummary,
  GeneratedReply,
  ProviderType,
  ProviderSendOptions,
  CommunicationSearchOptions,
  CommunicationSearchResult,
  CommunicationStats,
  SummaryType,
  ReplyTone,
  ScheduledMessage,
  CommunicationTemplate,
  ContactCommunicationStyle,
  ProviderHealth,
} from './CommunicationTypes'
import type { CommunicationConfig } from './CommunicationConfig'
import type { CommunicationProvider } from './CommunicationProvider'
import { CommunicationRegistry } from './CommunicationRegistry'
import { ConversationManager } from './ConversationManager'
import { CommunicationSearch } from './CommunicationSearch'
import { CommunicationAnalytics } from './CommunicationAnalytics'
import { CommunicationScheduler } from './CommunicationScheduler'
import { CommunicationTemplates } from './CommunicationTemplates'
import { ConversationMemory } from './ConversationMemory'

export class CommunicationEngine {
  private readonly registry: CommunicationRegistry
  private readonly manager: ConversationManager
  private readonly searchEngine: CommunicationSearch
  private readonly analytics: CommunicationAnalytics
  private readonly scheduler: CommunicationScheduler
  private readonly templates: CommunicationTemplates
  private readonly memory: ConversationMemory

  constructor(
    db: admin.firestore.Firestore,
    config: CommunicationConfig,
    apiKey: string
  ) {
    this.registry = new CommunicationRegistry()
    this.manager = new ConversationManager(db, config, this.registry, apiKey)
    this.searchEngine = new CommunicationSearch(db, config, apiKey, config.searchLimit)
    this.analytics = new CommunicationAnalytics(db)
    this.scheduler = new CommunicationScheduler(db, this.registry)
    this.templates = new CommunicationTemplates(db)
    this.memory = new ConversationMemory(db)
  }

  // ── Provider Management ───────────────────────────────────────────────────

  registerProvider(provider: CommunicationProvider): void {
    this.registry.registerProvider(provider)
  }

  listProviders(): Array<{ id: string; name: string; type: ProviderType }> {
    return this.registry.listRegistered()
  }

  async healthCheckAll(userId: string): Promise<ProviderHealth[]> {
    return Promise.all(
      this.registry.listProviders().map((p) => p.healthCheck(userId))
    )
  }

  // ── Message Operations ────────────────────────────────────────────────────

  async ingestMessage(userId: string, message: CommunicationMessage): Promise<ConversationThread> {
    return this.manager.ingestMessage(userId, message)
  }

  async sendMessage(userId: string, providerId: string, opts: ProviderSendOptions): Promise<CommunicationMessage> {
    return this.manager.sendMessage(userId, providerId, opts)
  }

  async syncProvider(userId: string, providerId: string): Promise<number> {
    return this.manager.syncProvider(userId, providerId)
  }

  // ── Thread Operations ─────────────────────────────────────────────────────

  async getThread(userId: string, threadId: string): Promise<ConversationThread | null> {
    return this.manager.getThread(userId, threadId)
  }

  async listThreads(
    userId: string,
    opts: { limit?: number; providerType?: ProviderType; status?: string } = {}
  ): Promise<ConversationThread[]> {
    return this.manager.listThreads(userId, opts)
  }

  async getMessages(userId: string, threadId: string, limit = 50): Promise<CommunicationMessage[]> {
    return this.manager.getMessages(userId, threadId, limit)
  }

  async markRead(userId: string, threadId: string): Promise<void> {
    return this.manager.markRead(userId, threadId)
  }

  async archiveThread(userId: string, threadId: string): Promise<void> {
    return this.manager.archiveThread(userId, threadId)
  }

  // ── Intelligence ──────────────────────────────────────────────────────────

  async analyzeThread(userId: string, threadId: string): Promise<ThreadAnalysis> {
    return this.manager.analyzeThread(userId, threadId)
  }

  async generateSummary(userId: string, threadId: string, type: SummaryType = 'thread'): Promise<ConversationSummary> {
    return this.manager.generateSummary(userId, threadId, type)
  }

  async generateReply(userId: string, messageId: string, tone: ReplyTone): Promise<GeneratedReply> {
    return this.manager.generateReply(userId, messageId, tone)
  }

  // ── Search ────────────────────────────────────────────────────────────────

  async search(userId: string, opts: CommunicationSearchOptions): Promise<CommunicationSearchResult[]> {
    return this.searchEngine.search(userId, opts)
  }

  // ── Analytics ────────────────────────────────────────────────────────────

  async getStats(userId: string): Promise<CommunicationStats> {
    return this.analytics.getStats(userId)
  }

  // ── Templates ────────────────────────────────────────────────────────────

  async createTemplate(
    userId: string,
    fields: Omit<CommunicationTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<CommunicationTemplate> {
    return this.templates.create(userId, fields)
  }

  async listTemplates(userId: string, providerType?: ProviderType): Promise<CommunicationTemplate[]> {
    return this.templates.list(userId, providerType)
  }

  async seedDefaultTemplates(userId: string): Promise<void> {
    return this.templates.seedDefaults(userId)
  }

  // ── Scheduler ────────────────────────────────────────────────────────────

  async scheduleMessage(
    userId: string,
    fields: Omit<ScheduledMessage, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<ScheduledMessage> {
    return this.scheduler.schedule(userId, fields)
  }

  async cancelScheduledMessage(userId: string, messageId: string): Promise<void> {
    return this.scheduler.cancel(userId, messageId)
  }

  async listScheduledMessages(userId: string): Promise<ScheduledMessage[]> {
    return this.scheduler.listPending(userId)
  }

  async processDueScheduled(userId: string): Promise<{ sent: number; failed: number }> {
    return this.scheduler.processDue(userId)
  }

  // ── Communication Memory ──────────────────────────────────────────────────

  async getContactStyle(userId: string, contactId: string): Promise<ContactCommunicationStyle | null> {
    return this.memory.getStyle(userId, contactId)
  }

  async updateContactStyle(
    userId: string,
    contactId: string,
    patch: Partial<ContactCommunicationStyle>
  ): Promise<void> {
    return this.memory.updateStyle(userId, contactId, patch)
  }
}
