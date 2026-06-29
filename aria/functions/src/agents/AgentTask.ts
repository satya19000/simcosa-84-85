import type { AgentId, AgentTaskId, GraphRunId, AgentCapability, AgentTaskStatus } from './AgentTypes'

/**
 * A discrete unit of work assigned to one agent.
 * Produced by the Planner and dispatched by the TaskRouter.
 */
export interface AgentTask {
  taskId: AgentTaskId
  graphRunId: GraphRunId
  userId: string

  /** Which capability this task requires. */
  capability: AgentCapability

  /** Which agent was assigned (set by TaskRouter). */
  assignedAgent?: AgentId

  /** Human-readable description of what is needed. */
  description: string

  /** Structured input data for the agent. */
  input: Record<string, unknown>

  /** IDs of tasks that must complete before this one can start. */
  dependsOn: AgentTaskId[]

  status: AgentTaskStatus

  /** Priority 0–100. Higher = scheduled sooner in parallel runs. */
  priority: number

  createdAt: string
  startedAt?: string
  completedAt?: string

  attempts: number

  /** Key to write the output into sharedVars. */
  outputKey?: string
}
