import type * as admin from 'firebase-admin'
import type { ExecutionId, WorkflowId } from './WorkflowTypes'

/**
 * Mutable execution context passed to every step.
 * Steps read inputs and write outputs through this — never through side channels.
 */
export interface WorkflowContext {
  /** Authenticated user running this workflow. */
  userId: string

  /** Stable display name (may be undefined for service-initiated runs). */
  userDisplayName?: string

  /** Firestore instance — steps that need data use this. */
  db: admin.firestore.Firestore

  /** ID of the workflow definition being executed. */
  workflowId: WorkflowId

  /** ID of this specific execution run. */
  executionId: ExecutionId

  /**
   * Shared variable store. Steps write their results here via outputKey.
   * Template substitution: "{{varName}}" in string fields is resolved against vars.
   */
  vars: Record<string, unknown>

  /** Trigger payload — whatever fired this workflow. */
  triggerData?: Record<string, unknown>

  /** Timestamp this execution started. */
  startedAt: string

  /** Whether this execution has been requested to cancel. */
  cancelRequested: boolean
}

/** Replace {{varName}} tokens in a template string from context vars. */
export function interpolate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = vars[key]
    return val !== undefined ? String(val) : `{{${key}}}`
  })
}
