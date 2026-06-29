import type { WorkflowId, ExecutionId, WorkflowStatus, StepStatus } from './WorkflowTypes'

export interface StepResult {
  stepId: string
  stepName: string
  status: StepStatus
  startedAt: string
  completedAt: string
  durationMs: number
  attempts: number
  output?: unknown
  error?: string
}

export interface WorkflowResult {
  workflowId: WorkflowId
  executionId: ExecutionId
  status: WorkflowStatus
  startedAt: string
  completedAt: string
  durationMs: number
  stepResults: StepResult[]
  /** Final contents of the context vars after execution. */
  outputVars: Record<string, unknown>
  error?: string
  cancelledBy?: string
}
