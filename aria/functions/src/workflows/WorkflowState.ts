import type { WorkflowId, ExecutionId, WorkflowStatus, StepStatus } from './WorkflowTypes'

/**
 * Persisted execution snapshot — written to Firestore so interrupted
 * workflows can be resumed across Cloud Function cold starts.
 *
 * Path: users/{userId}/workflowExecutions/{executionId}
 */
export interface WorkflowState {
  executionId: ExecutionId
  workflowId: WorkflowId
  userId: string
  status: WorkflowStatus
  currentStepIndex: number
  vars: Record<string, unknown>
  stepStatuses: Record<string, StepStatus>
  startedAt: string
  updatedAt: string
  completedAt?: string
  error?: string
  triggerData?: Record<string, unknown>
}
