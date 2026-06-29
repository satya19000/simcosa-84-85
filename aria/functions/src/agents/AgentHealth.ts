import type { AgentId, AgentStatus } from './AgentTypes'

export interface AgentHealthSnapshot {
  agentId: AgentId
  status: AgentStatus
  healthy: boolean
  lastCheckedAt: string
  responseTimeMs: number
  message?: string
}

export interface AgentHealthRecord {
  agentId: AgentId
  status: AgentStatus
  lastHealthyAt: string | null
  lastUnhealthyAt: string | null
  consecutiveFailures: number
  snapshots: AgentHealthSnapshot[]
}

/** Tracks health state for all registered agents. */
export class AgentHealthMonitor {
  private records = new Map<AgentId, AgentHealthRecord>()
  private readonly maxSnapshots = 10

  register(agentId: AgentId): void {
    this.records.set(agentId, {
      agentId,
      status: 'unregistered',
      lastHealthyAt: null,
      lastUnhealthyAt: null,
      consecutiveFailures: 0,
      snapshots: [],
    })
  }

  record(snapshot: AgentHealthSnapshot): void {
    const record = this.records.get(snapshot.agentId)
    if (!record) return

    record.status = snapshot.status
    record.snapshots.unshift(snapshot)
    if (record.snapshots.length > this.maxSnapshots) record.snapshots.pop()

    if (snapshot.healthy) {
      record.lastHealthyAt = snapshot.lastCheckedAt
      record.consecutiveFailures = 0
    } else {
      record.lastUnhealthyAt = snapshot.lastCheckedAt
      record.consecutiveFailures++
    }
  }

  get(agentId: AgentId): AgentHealthRecord | undefined {
    return this.records.get(agentId)
  }

  getAll(): AgentHealthRecord[] {
    return Array.from(this.records.values())
  }

  isHealthy(agentId: AgentId): boolean {
    const record = this.records.get(agentId)
    if (!record) return false
    return record.consecutiveFailures < 3 && record.status !== 'error' && record.status !== 'disabled'
  }
}
