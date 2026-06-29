import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'

export interface WorkflowSummary {
  id: string
  name: string
  description: string
  version: string
  trigger: { type: string; cron?: string }
  enabled: boolean
  tags: string[]
  stepCount: number
}

export interface WorkflowSchedule {
  workflowId: string
  cron: string
  timezone: string
  enabled: boolean
  lastRunAt: string | null
  nextRunAt: string | null
}

export interface StepResult {
  stepId: string
  stepName: string
  status: string
  durationMs: number
  attempts: number
  output?: unknown
  error?: string
}

export interface WorkflowRunResult {
  workflowId: string
  executionId: string
  status: string
  startedAt: string
  completedAt: string
  durationMs: number
  stepResults: StepResult[]
  error?: string
}

const runWorkflowFn = httpsCallable<{ workflowId: string; triggerData?: Record<string, unknown> }, WorkflowRunResult>(functions, 'runWorkflow')
const listWorkflowsFn = httpsCallable<void, { workflows: WorkflowSummary[] }>(functions, 'listWorkflows')
const getWorkflowHistoryFn = httpsCallable<{ workflowId?: string; limit?: number }, WorkflowRunResult[]>(functions, 'getWorkflowHistory')
const getWorkflowSchedulesFn = httpsCallable<void, { schedules: WorkflowSchedule[] }>(functions, 'getWorkflowSchedules')
const setWorkflowEnabledFn = httpsCallable<{ workflowId: string; enabled: boolean }, { workflowId: string; enabled: boolean }>(functions, 'setWorkflowEnabled')

export async function runWorkflow(workflowId: string, triggerData?: Record<string, unknown>): Promise<WorkflowRunResult> {
  const res = await runWorkflowFn({ workflowId, triggerData })
  return res.data
}

export async function listWorkflows(): Promise<WorkflowSummary[]> {
  const res = await listWorkflowsFn()
  return res.data.workflows
}

export async function getWorkflowHistory(workflowId?: string, limit = 20): Promise<WorkflowRunResult[]> {
  const res = await getWorkflowHistoryFn({ workflowId, limit })
  return res.data
}

export async function getWorkflowSchedules(): Promise<WorkflowSchedule[]> {
  const res = await getWorkflowSchedulesFn()
  return res.data.schedules
}

export async function setWorkflowEnabled(workflowId: string, enabled: boolean): Promise<void> {
  await setWorkflowEnabledFn({ workflowId, enabled })
}
