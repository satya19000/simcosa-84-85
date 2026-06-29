import type * as admin from 'firebase-admin'
import type { WorkflowDefinition } from './Workflow'
import type { WorkflowResult } from './WorkflowResult'
import type { WorkflowId, TriggerType } from './WorkflowTypes'
import { WorkflowRegistry } from './WorkflowRegistry'
import { WorkflowRunner } from './WorkflowRunner'
import { WorkflowHistory } from './WorkflowHistory'
import { WorkflowScheduler } from './WorkflowScheduler'
import { MorningBriefingWorkflow } from './builtin/MorningBriefingWorkflow'
import { TodaysPlanningWorkflow } from './builtin/TodaysPlanningWorkflow'
import { PrepareForTomorrowWorkflow } from './builtin/PrepareForTomorrowWorkflow'
import { OverdueTaskRecoveryWorkflow } from './builtin/OverdueTaskRecoveryWorkflow'
import { ReminderEscalationWorkflow } from './builtin/ReminderEscalationWorkflow'
import { ContactFollowUpWorkflow } from './builtin/ContactFollowUpWorkflow'
import { WeeklyReviewWorkflow } from './builtin/WeeklyReviewWorkflow'

// ── Singleton registry — shared across warm Cloud Function instances ───────────

export const workflowRegistry = new WorkflowRegistry()

const BUILTIN_WORKFLOWS: WorkflowDefinition[] = [
  MorningBriefingWorkflow,
  TodaysPlanningWorkflow,
  PrepareForTomorrowWorkflow,
  OverdueTaskRecoveryWorkflow,
  ReminderEscalationWorkflow,
  ContactFollowUpWorkflow,
  WeeklyReviewWorkflow,
]

let registered = false

function ensureBuiltinsRegistered(): void {
  if (registered) return
  registered = true
  for (const wf of BUILTIN_WORKFLOWS) {
    workflowRegistry.register(wf)
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function runWorkflow(
  workflowId: WorkflowId,
  userId: string,
  db: admin.firestore.Firestore,
  apiKey?: string,
  triggerData?: Record<string, unknown>,
  userDisplayName?: string
): Promise<WorkflowResult> {
  ensureBuiltinsRegistered()
  const definition = workflowRegistry.get(workflowId)
  if (!definition) throw new Error(`Workflow "${workflowId}" not found`)
  if (!definition.enabled) throw new Error(`Workflow "${workflowId}" is disabled`)
  const runner = new WorkflowRunner(db, apiKey)
  return runner.run(definition, userId, triggerData, userDisplayName)
}

export async function getWorkflowHistory(
  userId: string,
  db: admin.firestore.Firestore,
  workflowId?: WorkflowId,
  limit?: number
): Promise<WorkflowResult[]> {
  const history = new WorkflowHistory(db)
  return history.list(userId, { workflowId, limit })
}

export function listWorkflows(triggerType?: TriggerType): WorkflowDefinition[] {
  ensureBuiltinsRegistered()
  return triggerType ? workflowRegistry.listByTrigger(triggerType) : workflowRegistry.list()
}

export function registerWorkflow(definition: WorkflowDefinition): void {
  ensureBuiltinsRegistered()
  workflowRegistry.register(definition)
}

export async function getScheduledWorkflows(
  userId: string,
  db: admin.firestore.Firestore
) {
  const scheduler = new WorkflowScheduler(db)
  return scheduler.list(userId)
}

// Re-export types and classes for external consumers
export type { WorkflowDefinition } from './Workflow'
export type { WorkflowStep } from './WorkflowStep'
export type { WorkflowContext } from './WorkflowContext'
export type { WorkflowResult, StepResult } from './WorkflowResult'
export type { WorkflowState } from './WorkflowState'
export type { WorkflowId, ExecutionId, WorkflowStatus, StepStatus, WorkflowTrigger, TriggerType } from './WorkflowTypes'
export type { WorkflowSchedule } from './WorkflowScheduler'
export { WorkflowRunner } from './WorkflowRunner'
export { WorkflowRegistry } from './WorkflowRegistry'
export { WorkflowHistory } from './WorkflowHistory'
export { WorkflowScheduler } from './WorkflowScheduler'
export { WorkflowMetrics } from './WorkflowMetrics'
export { WorkflowLogger } from './WorkflowLogger'
export { validateWorkflow } from './WorkflowValidator'
export { registerCustomStepHandler } from './WorkflowRunner'
