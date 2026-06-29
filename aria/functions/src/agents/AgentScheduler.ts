import type { AgentId } from './AgentTypes'
import { AgentManager } from './AgentManager'
import { AgentMemory } from './AgentMemory'
import { AgentLogger } from './AgentLogger'

interface ScheduledJob {
  id: string
  intervalMs: number
  lastRanAt: number
  run: () => Promise<void>
}

/**
 * Background job runner for periodic agent tasks.
 * Runs in Cloud Function warm instances — no real setInterval needed;
 * tick() is called explicitly (e.g., on each incoming request) to fire due jobs.
 */
export class AgentScheduler {
  private readonly logger = new AgentLogger('agent-scheduler')
  private readonly jobs = new Map<string, ScheduledJob>()
  private readonly memories = new Map<AgentId, AgentMemory>()

  constructor(private readonly manager: AgentManager) {
    this.registerBuiltinJobs()
  }

  private registerBuiltinJobs(): void {
    // Health check all agents every 5 minutes
    this.addJob('health-check', 5 * 60 * 1000, async () => {
      await this.manager.checkAllHealth()
      this.logger.debug('Periodic health check complete')
    })

    // Cache eviction every 10 minutes
    this.addJob('cache-eviction', 10 * 60 * 1000, async () => {
      let total = 0
      for (const mem of this.memories.values()) {
        total += mem.evictExpired()
      }
      if (total > 0) this.logger.debug(`Evicted ${total} expired cache entries`)
    })
  }

  addJob(id: string, intervalMs: number, run: () => Promise<void>): void {
    this.jobs.set(id, { id, intervalMs, lastRanAt: 0, run })
  }

  removeJob(id: string): void {
    this.jobs.delete(id)
  }

  registerMemory(agentId: AgentId, memory: AgentMemory): void {
    this.memories.set(agentId, memory)
  }

  /** Call this on each warm-instance request to fire any overdue jobs. */
  async tick(): Promise<void> {
    const now = Date.now()
    for (const job of this.jobs.values()) {
      if (now - job.lastRanAt >= job.intervalMs) {
        job.lastRanAt = now
        try {
          await job.run()
        } catch (err) {
          this.logger.error(`Scheduled job "${job.id}" failed: ${String(err)}`)
        }
      }
    }
  }

  listJobs(): Array<{ id: string; intervalMs: number; lastRanAt: number }> {
    return Array.from(this.jobs.values()).map(({ id, intervalMs, lastRanAt }) => ({
      id,
      intervalMs,
      lastRanAt,
    }))
  }
}
