import type { AgentId, AgentTaskId } from './AgentTypes'

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

interface RecentJob {
  taskId: AgentTaskId
  description: string
  success: boolean
  durationMs: number
  completedAt: string
}

/**
 * In-process memory for a single agent instance.
 * Resets on cold start — for persistence, agents write to Firestore via ActionEngine.
 */
export class AgentMemory {
  private cache = new Map<string, CacheEntry<unknown>>()
  private recentJobs: RecentJob[] = []
  private readonly maxJobs = 50
  private readonly ttlMs: number

  constructor(
    private readonly agentId: AgentId,
    ttlMs = 60_000
  ) {
    this.ttlMs = ttlMs
  }

  // ── Cache ──────────────────────────────────────────────────────────────────

  set<T>(key: string, value: T, ttlMs?: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.ttlMs),
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return entry.value as T
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  evictExpired(): number {
    const now = Date.now()
    let evicted = 0
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        evicted++
      }
    }
    return evicted
  }

  // ── Recent jobs ────────────────────────────────────────────────────────────

  recordJob(job: RecentJob): void {
    this.recentJobs.unshift(job)
    if (this.recentJobs.length > this.maxJobs) this.recentJobs.pop()
  }

  getRecentJobs(limit = 10): RecentJob[] {
    return this.recentJobs.slice(0, limit)
  }

  // ── Diagnostics ────────────────────────────────────────────────────────────

  cacheSize(): number { return this.cache.size }
  jobCount(): number  { return this.recentJobs.length }
  agentId_(): AgentId { return this.agentId }
}
