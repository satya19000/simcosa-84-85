import type { WorkflowId, WorkflowTrigger, RetryPolicy } from './WorkflowTypes'
import type { WorkflowStep } from './WorkflowStep'

/**
 * A reusable, named sequence of steps that ARIA can execute automatically.
 * Workflows are immutable definitions — each run creates a separate execution record.
 */
export interface WorkflowDefinition {
  id: WorkflowId
  name: string
  description: string
  version: string

  /** What fires this workflow. */
  trigger: WorkflowTrigger

  /** Ordered steps (may include parallel groups). */
  steps: WorkflowStep[]

  /** Default retry policy — each step can override. */
  defaultRetryPolicy?: Partial<RetryPolicy>

  /** Wall-clock timeout for the entire run in milliseconds. */
  timeoutMs?: number

  /** Permissions this workflow requires (matches PluginPermission names). */
  permissions?: string[]

  /** Arbitrary metadata for filtering and display. */
  tags?: string[]

  /** Whether the workflow is enabled and can be triggered. */
  enabled: boolean

  createdAt: string
  updatedAt: string
}
