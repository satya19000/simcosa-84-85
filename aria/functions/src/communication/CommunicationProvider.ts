import type {
  ProviderType,
  ProviderStatus,
  ProviderHealth,
  ProviderCredentials,
  ProviderSendOptions,
  ProviderReceiveResult,
  ProviderSearchResult,
  CommunicationMessage,
} from './CommunicationTypes'

// ── Provider Interface ────────────────────────────────────────────────────────

export interface CommunicationProvider {
  readonly id: string
  readonly name: string
  readonly type: ProviderType
  readonly supportsSearch: boolean
  readonly supportsAttachments: boolean
  readonly supportsRichContent: boolean

  initialize(config: Record<string, unknown>): Promise<void>
  authenticate(credentials: ProviderCredentials): Promise<void>
  connect(userId: string): Promise<void>
  disconnect(userId: string): Promise<void>
  send(userId: string, opts: ProviderSendOptions): Promise<CommunicationMessage>
  receive(userId: string, cursor?: string): Promise<ProviderReceiveResult>
  sync(userId: string): Promise<number>
  search(userId: string, query: string, limit?: number): Promise<ProviderSearchResult>
  healthCheck(userId: string): Promise<ProviderHealth>
  shutdown(): Promise<void>
  getStatus(userId: string): ProviderStatus
}

// ── No-Op Provider (placeholder for unimplemented channels) ─────────────────

export class NoOpProvider implements CommunicationProvider {
  readonly supportsSearch = false
  readonly supportsAttachments = false
  readonly supportsRichContent = false

  constructor(
    readonly id: string,
    readonly name: string,
    readonly type: ProviderType
  ) {}

  async initialize(_config: Record<string, unknown>): Promise<void> {}
  async authenticate(_credentials: ProviderCredentials): Promise<void> {}
  async connect(_userId: string): Promise<void> {}
  async disconnect(_userId: string): Promise<void> {}

  async send(_userId: string, _opts: ProviderSendOptions): Promise<CommunicationMessage> {
    throw new Error(`Provider "${this.name}" is not yet implemented`)
  }

  async receive(_userId: string, _cursor?: string): Promise<ProviderReceiveResult> {
    return { messages: [], hasMore: false }
  }

  async sync(_userId: string): Promise<number> {
    return 0
  }

  async search(_userId: string, _query: string, _limit?: number): Promise<ProviderSearchResult> {
    return { messages: [], total: 0 }
  }

  async healthCheck(userId: string): Promise<ProviderHealth> {
    return {
      providerId: this.id,
      status: 'disconnected',
      lastCheckedAt: new Date().toISOString(),
      error: `Provider "${this.name}" is a placeholder — not yet implemented`,
    }
  }

  async shutdown(): Promise<void> {}

  getStatus(_userId: string): ProviderStatus {
    return 'disconnected'
  }
}

// ── Base Abstract Provider ────────────────────────────────────────────────────
// Extend this when implementing a real provider.

export abstract class BaseProvider implements CommunicationProvider {
  abstract readonly id: string
  abstract readonly name: string
  abstract readonly type: ProviderType
  abstract readonly supportsSearch: boolean
  abstract readonly supportsAttachments: boolean
  abstract readonly supportsRichContent: boolean

  protected statuses = new Map<string, ProviderStatus>()

  getStatus(userId: string): ProviderStatus {
    return this.statuses.get(userId) ?? 'disconnected'
  }

  protected setStatus(userId: string, status: ProviderStatus): void {
    this.statuses.set(userId, status)
  }

  abstract initialize(config: Record<string, unknown>): Promise<void>
  abstract authenticate(credentials: ProviderCredentials): Promise<void>
  abstract connect(userId: string): Promise<void>
  abstract disconnect(userId: string): Promise<void>
  abstract send(userId: string, opts: ProviderSendOptions): Promise<CommunicationMessage>
  abstract receive(userId: string, cursor?: string): Promise<ProviderReceiveResult>
  abstract sync(userId: string): Promise<number>
  abstract search(userId: string, query: string, limit?: number): Promise<ProviderSearchResult>
  abstract healthCheck(userId: string): Promise<ProviderHealth>
  abstract shutdown(): Promise<void>
}
