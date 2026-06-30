import type { HealthProviderStatus, HealthProviderHealth, HealthProviderSearchResult } from './HealthTypes'

export interface HealthProviderCredentials {
  [key: string]: string | undefined
}

// ── Provider Interface ────────────────────────────────────────────────────────
// Represents an external healthcare data source/system (HIS, EMR, lab system,
// vaccination registry, etc). Core engine never references a vendor directly.

export interface HealthProvider {
  readonly id: string
  readonly name: string
  readonly type: string

  initialize(config: Record<string, unknown>): Promise<void>
  authenticate(credentials: HealthProviderCredentials): Promise<void>
  connect(userId: string): Promise<void>
  disconnect(userId: string): Promise<void>
  search(userId: string, query: string, limit?: number): Promise<HealthProviderSearchResult>
  sync(userId: string): Promise<number>
  healthCheck(userId: string): Promise<HealthProviderHealth>
  shutdown(): Promise<void>
  getStatus(userId: string): HealthProviderStatus
}

// ── No-Op Provider (placeholder) ──────────────────────────────────────────────

export class NoOpHealthProvider implements HealthProvider {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly type: string
  ) {}

  async initialize(_config: Record<string, unknown>): Promise<void> {}
  async authenticate(_credentials: HealthProviderCredentials): Promise<void> {}
  async connect(_userId: string): Promise<void> {}
  async disconnect(_userId: string): Promise<void> {}

  async search(_userId: string, _query: string, _limit?: number): Promise<HealthProviderSearchResult> {
    return { items: [], total: 0 }
  }

  async sync(_userId: string): Promise<number> {
    return 0
  }

  async healthCheck(userId: string): Promise<HealthProviderHealth> {
    void userId
    return {
      providerId: this.id,
      status: 'disconnected',
      lastCheckedAt: new Date().toISOString(),
      error: `Provider "${this.name}" is a placeholder — not yet implemented`,
    }
  }

  async shutdown(): Promise<void> {}

  getStatus(_userId: string): HealthProviderStatus {
    return 'disconnected'
  }
}

// ── Base Abstract Provider ────────────────────────────────────────────────────

export abstract class BaseHealthProvider implements HealthProvider {
  abstract readonly id: string
  abstract readonly name: string
  abstract readonly type: string

  protected statuses = new Map<string, HealthProviderStatus>()

  getStatus(userId: string): HealthProviderStatus {
    return this.statuses.get(userId) ?? 'disconnected'
  }

  protected setStatus(userId: string, status: HealthProviderStatus): void {
    this.statuses.set(userId, status)
  }

  abstract initialize(config: Record<string, unknown>): Promise<void>
  abstract authenticate(credentials: HealthProviderCredentials): Promise<void>
  abstract connect(userId: string): Promise<void>
  abstract disconnect(userId: string): Promise<void>
  abstract search(userId: string, query: string, limit?: number): Promise<HealthProviderSearchResult>
  abstract sync(userId: string): Promise<number>
  abstract healthCheck(userId: string): Promise<HealthProviderHealth>
  abstract shutdown(): Promise<void>
}
