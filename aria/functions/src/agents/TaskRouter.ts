import type { Agent } from './Agent'
import type { AgentTask } from './AgentTask'
import type { AgentId, RoutingStrategy } from './AgentTypes'
import type { AgentRegistry } from './AgentRegistry'
import type { AgentHealthMonitor } from './AgentHealth'
import { AgentLogger } from './AgentLogger'

export interface RoutingDecision {
  task: AgentTask
  agentId: AgentId
  strategy: RoutingStrategy
  reason: string
}

/**
 * Routes tasks to the best available agent based on capability, health, and load.
 * No switch statements — pure capability-based lookup through the registry.
 */
export class TaskRouter {
  private readonly logger = new AgentLogger('task-router')

  constructor(
    private readonly registry: AgentRegistry,
    private readonly health: AgentHealthMonitor
  ) {}

  /** Find the best healthy agent for a task. Returns undefined if none available. */
  route(task: AgentTask): RoutingDecision | undefined {
    const candidates = this.registry.getByCapability(task.capability)

    if (candidates.length === 0) {
      this.logger.warn(`No agents registered for capability "${task.capability}"`, task.taskId)
      return undefined
    }

    // Filter to healthy agents
    const healthy = candidates.filter((a) => this.health.isHealthy(a.manifest.id))

    // Further filter to those that can handle this specific task
    const capable = (healthy.length > 0 ? healthy : candidates).filter((a) => a.canHandle(task))

    if (capable.length === 0) {
      this.logger.warn(`No capable agents for task "${task.taskId}" (capability: ${task.capability})`, task.taskId)
      return undefined
    }

    // Pick least-busy (idle > busy) then alphabetical for determinism
    const selected = this.selectBest(capable)

    const decision: RoutingDecision = {
      task: { ...task, assignedAgent: selected.manifest.id },
      agentId: selected.manifest.id,
      strategy: 'single',
      reason: `Selected "${selected.manifest.name}" for capability "${task.capability}"`,
    }

    this.logger.info(`Routed task ${task.taskId} → ${selected.manifest.id}`, task.taskId)
    return decision
  }

  /** Route multiple tasks, returning routing decisions for all. */
  routeAll(tasks: AgentTask[]): Map<AgentId, RoutingDecision> {
    const decisions = new Map<AgentId, RoutingDecision>()
    for (const task of tasks) {
      const decision = this.route(task)
      if (decision) {
        decisions.set(task.taskId, decision)
      }
    }
    return decisions
  }

  private selectBest(agents: Agent[]): Agent {
    // Prefer idle agents; within the same status, prefer alphabetical ID for determinism
    return agents.sort((a, b) => {
      if (a.status === 'idle' && b.status !== 'idle') return -1
      if (b.status === 'idle' && a.status !== 'idle') return 1
      return a.manifest.id.localeCompare(b.manifest.id)
    })[0]!
  }
}
