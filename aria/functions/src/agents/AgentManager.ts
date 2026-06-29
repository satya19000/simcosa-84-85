import type { Agent, AgentManifest } from './Agent'
import type { AgentId } from './AgentTypes'
import type { AgentConfig } from './AgentConfig'
import { AgentRegistry } from './AgentRegistry'
import { AgentHealthMonitor } from './AgentHealth'
import { AgentMetrics } from './AgentMetrics'
import { AgentLogger } from './AgentLogger'
import { agentEventBus } from './AgentEvents'
import { resolveAgentConfig } from './AgentConfig'

export interface AgentManagerStats {
  total: number
  idle: number
  busy: number
  error: number
  disabled: number
}

export class AgentManager {
  private readonly logger = new AgentLogger('agent-manager')
  private readonly metrics = new Map<AgentId, AgentMetrics>()
  private config: AgentConfig

  constructor(
    private readonly registry: AgentRegistry,
    private readonly health: AgentHealthMonitor,
    config?: Partial<AgentConfig>
  ) {
    this.config = resolveAgentConfig(config)
  }

  /** Register and initialize an agent. */
  async register(agent: Agent): Promise<void> {
    if (this.registry.has(agent.manifest.id)) {
      this.logger.warn(`Agent "${agent.manifest.id}" already registered — skipping`)
      return
    }

    agent.status = 'initializing'
    this.registry.register(agent)
    this.health.register(agent.manifest.id)
    this.metrics.set(agent.manifest.id, new AgentMetrics(agent.manifest.id))

    try {
      await agent.initialize(this.config)
      agent.status = 'idle'
      this.logger.info(`Agent "${agent.manifest.id}" registered and initialized`)
      await agentEventBus.emit('agent:registered', agent.manifest.id, { manifest: agent.manifest })
    } catch (err) {
      agent.status = 'error'
      this.logger.error(`Agent "${agent.manifest.id}" failed to initialize: ${String(err)}`)
    }
  }

  /** Register multiple agents in parallel. */
  async registerAll(agents: Agent[]): Promise<void> {
    await Promise.all(agents.map((a) => this.register(a)))
  }

  /** Gracefully shut down and unregister an agent. */
  async unregister(agentId: AgentId): Promise<void> {
    const agent = this.registry.get(agentId)
    if (!agent) return
    try {
      agent.status = 'shutdown'
      await agent.shutdown()
    } catch (err) {
      this.logger.warn(`Agent "${agentId}" shutdown error: ${String(err)}`)
    }
    this.registry.unregister(agentId)
    this.metrics.delete(agentId)
    this.logger.info(`Agent "${agentId}" unregistered`)
  }

  /** Disable an agent without unregistering (keeps manifest). */
  disable(agentId: AgentId): void {
    const agent = this.registry.get(agentId)
    if (agent) {
      agent.status = 'disabled'
      this.logger.info(`Agent "${agentId}" disabled`)
    }
  }

  /** Re-enable a previously disabled agent. */
  enable(agentId: AgentId): void {
    const agent = this.registry.get(agentId)
    if (agent && agent.status === 'disabled') {
      agent.status = 'idle'
      this.logger.info(`Agent "${agentId}" enabled`)
    }
  }

  /** Run a health check on a single agent and record the result. */
  async checkHealth(agentId: AgentId): Promise<void> {
    const agent = this.registry.get(agentId)
    if (!agent) return
    try {
      const snapshot = await agent.healthCheck()
      this.health.record(snapshot)
      if (!snapshot.healthy) {
        this.logger.warn(`Agent "${agentId}" health degraded: ${snapshot.message ?? 'unknown'}`)
        await agentEventBus.emit('agent:health:degraded', agentId, snapshot)
      }
    } catch (err) {
      this.health.record({
        agentId,
        status: 'error',
        healthy: false,
        lastCheckedAt: new Date().toISOString(),
        responseTimeMs: 0,
        message: String(err),
      })
    }
  }

  /** Run health checks on all registered agents. */
  async checkAllHealth(): Promise<void> {
    const agents = this.registry.listAll()
    await Promise.all(agents.map((a) => this.checkHealth(a.manifest.id)))
  }

  /** Restart a failed agent: shut down then re-initialize. */
  async restart(agentId: AgentId): Promise<void> {
    const agent = this.registry.get(agentId)
    if (!agent) return
    this.logger.info(`Restarting agent "${agentId}"`)
    try {
      await agent.shutdown()
    } catch (_) {
      // best-effort
    }
    agent.status = 'initializing'
    try {
      await agent.initialize(this.config)
      agent.status = 'idle'
      this.logger.info(`Agent "${agentId}" restarted successfully`)
    } catch (err) {
      agent.status = 'error'
      this.logger.error(`Agent "${agentId}" failed to restart: ${String(err)}`)
    }
  }

  getMetrics(agentId: AgentId): AgentMetrics | undefined {
    return this.metrics.get(agentId)
  }

  stats(): AgentManagerStats {
    const all = this.registry.listAll()
    return {
      total: all.length,
      idle: all.filter((a) => a.status === 'idle').length,
      busy: all.filter((a) => a.status === 'busy').length,
      error: all.filter((a) => a.status === 'error').length,
      disabled: all.filter((a) => a.status === 'disabled').length,
    }
  }

  listManifests(): AgentManifest[] {
    return this.registry.listManifests()
  }
}
