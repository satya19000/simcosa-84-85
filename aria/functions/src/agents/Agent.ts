import type { AgentContext } from './AgentContext'
import type { AgentTask } from './AgentTask'
import type { AgentResult } from './AgentResult'
import type { AgentId, AgentCapability, AgentStatus, ValidationResult } from './AgentTypes'
import type { AgentConfig } from './AgentConfig'
import type { AgentHealthSnapshot } from './AgentHealth'

/**
 * Base manifest every agent must declare.
 * Registered in AgentRegistry without instantiating the agent.
 */
export interface AgentManifest {
  id: AgentId
  name: string
  description: string
  version: string
  /** Capabilities this agent provides — used by TaskRouter. */
  capabilities: AgentCapability[]
  /** Whether this agent is a placeholder (not yet implemented). */
  placeholder?: boolean
}

/**
 * The contract every ARIA agent must implement.
 * Lifecycle: initialize → canHandle → plan → execute → validate → [rollback] → shutdown
 *
 * Security contract:
 *   - Never write to Firestore directly — use ActionEngine via ctx.
 *   - Never store userId, apiKey, or db reference beyond the current call.
 *   - All external writes go through ActionEngine.run().
 */
export interface Agent {
  readonly manifest: AgentManifest
  readonly config: AgentConfig
  status: AgentStatus

  /** Called once when the agent is first registered and activated. */
  initialize(config: AgentConfig): Promise<void>

  /** Returns true if this agent can handle the given task. */
  canHandle(task: AgentTask): boolean

  /**
   * Optional: decompose a complex task into sub-steps.
   * Returns enriched input that execute() will receive.
   * Default implementation: pass-through.
   */
  plan(task: AgentTask, ctx: AgentContext): Promise<Record<string, unknown>>

  /** Execute the task and return a result. Must not throw — catch and return error result. */
  execute(task: AgentTask, ctx: AgentContext): Promise<AgentResult>

  /**
   * Validate the output of execute().
   * Called by Orchestrator before accepting the result.
   */
  validate(result: AgentResult, ctx: AgentContext): Promise<ValidationResult>

  /**
   * Attempt to undo side effects if execute() produced an invalid result.
   * Best-effort — failures are logged but do not propagate.
   */
  rollback(task: AgentTask, ctx: AgentContext): Promise<void>

  /** Called before the agent is removed from the registry. */
  shutdown(): Promise<void>

  /** Must return within 5s. Used by AgentHealthMonitor. */
  healthCheck(): Promise<AgentHealthSnapshot>
}
