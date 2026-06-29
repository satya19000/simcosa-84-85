import type { AgentId, AgentTaskId, GraphRunId } from './AgentTypes'

export type AgentEventName =
  | 'agent:registered'
  | 'agent:task:assigned'
  | 'agent:task:started'
  | 'agent:task:completed'
  | 'agent:task:failed'
  | 'agent:task:retrying'
  | 'agent:graph:started'
  | 'agent:graph:completed'
  | 'agent:graph:failed'
  | 'agent:health:degraded'
  | 'agent:health:restored'

export interface AgentEvent<T = unknown> {
  name: AgentEventName
  agentId: AgentId | 'orchestrator'
  taskId?: AgentTaskId
  graphRunId?: GraphRunId
  userId?: string
  timestamp: string
  data: T
}

type AgentEventHandler<T = unknown> = (event: AgentEvent<T>) => void | Promise<void>

/** Lightweight in-process event bus for agent coordination. No direct coupling. */
export class AgentEventBus {
  private handlers = new Map<AgentEventName, Set<AgentEventHandler>>()

  on<T = unknown>(event: AgentEventName, handler: AgentEventHandler<T>): () => void {
    const set = this.handlers.get(event) ?? new Set<AgentEventHandler>()
    set.add(handler as AgentEventHandler)
    this.handlers.set(event, set)
    return () => this.handlers.get(event)?.delete(handler as AgentEventHandler)
  }

  async emit<T = unknown>(
    name: AgentEventName,
    agentId: AgentId | 'orchestrator',
    data: T,
    opts?: { taskId?: AgentTaskId; graphRunId?: GraphRunId; userId?: string }
  ): Promise<void> {
    const event: AgentEvent<T> = {
      name,
      agentId,
      taskId: opts?.taskId,
      graphRunId: opts?.graphRunId,
      userId: opts?.userId,
      timestamp: new Date().toISOString(),
      data,
    }
    const handlers = this.handlers.get(name)
    if (!handlers || handlers.size === 0) return
    await Promise.allSettled(Array.from(handlers).map((h) => h(event as AgentEvent)))
  }

  listSubscriptions(): Record<string, number> {
    const out: Record<string, number> = {}
    for (const [name, set] of this.handlers) out[name] = set.size
    return out
  }
}

export const agentEventBus = new AgentEventBus()
