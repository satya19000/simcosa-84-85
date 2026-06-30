import type { FinanceProviderStatus, FinanceProviderHealth, FinanceProviderSearchResult } from './FinanceTypes'

export interface FinanceProviderCredentials {
  [key: string]: string | undefined
}

// ── Provider Interface ────────────────────────────────────────────────────────
// Represents an external financial data source/system (bank, UPI gateway,
// credit card processor, accounting system, ERP, government finance API).
// Core engine never references a vendor directly.

export interface FinanceProvider {
  readonly id: string
  readonly name: string
  readonly type: string

  initialize(config: Record<string, unknown>): Promise<void>
  authenticate(credentials: FinanceProviderCredentials): Promise<void>
  connect(userId: string): Promise<void>
  disconnect(userId: string): Promise<void>
  search(userId: string, query: string, limit?: number): Promise<FinanceProviderSearchResult>
  sync(userId: string): Promise<number>
  healthCheck(userId: string): Promise<FinanceProviderHealth>
  shutdown(): Promise<void>
  getStatus(userId: string): FinanceProviderStatus
}

// ── No-Op Provider (placeholder) ──────────────────────────────────────────────

export class NoOpFinanceProvider implements FinanceProvider {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly type: string
  ) {}

  async initialize(_config: Record<string, unknown>): Promise<void> {}
  async authenticate(_credentials: FinanceProviderCredentials): Promise<void> {}
  async connect(_userId: string): Promise<void> {}
  async disconnect(_userId: string): Promise<void> {}

  async search(_userId: string, _query: string, _limit?: number): Promise<FinanceProviderSearchResult> {
    return { items: [], total: 0 }
  }

  async sync(_userId: string): Promise<number> {
    return 0
  }

  async healthCheck(userId: string): Promise<FinanceProviderHealth> {
    void userId
    return {
      providerId: this.id,
      status: 'disconnected',
      lastCheckedAt: new Date().toISOString(),
      error: `Provider "${this.name}" is a placeholder — not yet implemented`,
    }
  }

  async shutdown(): Promise<void> {}

  getStatus(_userId: string): FinanceProviderStatus {
    return 'disconnected'
  }
}

// ── Base Abstract Provider ────────────────────────────────────────────────────

export abstract class BaseFinanceProvider implements FinanceProvider {
  abstract readonly id: string
  abstract readonly name: string
  abstract readonly type: string

  protected statuses = new Map<string, FinanceProviderStatus>()

  getStatus(userId: string): FinanceProviderStatus {
    return this.statuses.get(userId) ?? 'disconnected'
  }

  protected setStatus(userId: string, status: FinanceProviderStatus): void {
    this.statuses.set(userId, status)
  }

  abstract initialize(config: Record<string, unknown>): Promise<void>
  abstract authenticate(credentials: FinanceProviderCredentials): Promise<void>
  abstract connect(userId: string): Promise<void>
  abstract disconnect(userId: string): Promise<void>
  abstract search(userId: string, query: string, limit?: number): Promise<FinanceProviderSearchResult>
  abstract sync(userId: string): Promise<number>
  abstract healthCheck(userId: string): Promise<FinanceProviderHealth>
  abstract shutdown(): Promise<void>
}
