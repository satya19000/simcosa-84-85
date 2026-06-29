import type { AgentTaskId, GraphRunId, AgentTaskStatus, ValidationResult } from './AgentTypes'

/** The output produced by one agent completing one task. */
export interface AgentResult {
  taskId: AgentTaskId
  graphRunId: GraphRunId
  agentId: string
  status: AgentTaskStatus

  /** Structured output — shape varies by agent. */
  output: unknown

  /** Natural-language summary for use in final response assembly. */
  summary: string

  /** Token usage if an LLM call was made. */
  tokenUsage?: { input: number; output: number }

  durationMs: number
  attempts: number

  validationResult?: ValidationResult

  error?: string
  completedAt: string
}

/** Aggregated result of an entire graph run. */
export interface GraphRunResult {
  graphRunId: GraphRunId
  userId: string
  status: 'completed' | 'partial' | 'failed' | 'cancelled'

  /** Merged summaries from all completed agents, in dependency order. */
  assembledResponse: string

  taskResults: AgentResult[]
  sharedVars: Record<string, unknown>

  totalDurationMs: number
  startedAt: string
  completedAt: string
  error?: string
}
