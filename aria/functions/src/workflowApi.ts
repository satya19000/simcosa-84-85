import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import {
  runWorkflow,
  getWorkflowHistory,
  listWorkflows,
  getScheduledWorkflows,
  workflowRegistry,
} from './workflows'
import type { WorkflowId } from './workflows'

const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY')

interface RunWorkflowRequest {
  workflowId: WorkflowId
  triggerData?: Record<string, unknown>
}

interface GetHistoryRequest {
  workflowId?: WorkflowId
  limit?: number
}

interface SetWorkflowEnabledRequest {
  workflowId: WorkflowId
  enabled: boolean
}

function requireAuth(request: CallableRequest<unknown>): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in')
  return request.auth.uid
}

export const runWorkflowFn = onCall(
  { secrets: [anthropicApiKey], timeoutSeconds: 300, memory: '512MiB' },
  async (request: CallableRequest<RunWorkflowRequest>) => {
    const userId = requireAuth(request)
    const { workflowId, triggerData } = request.data
    if (!workflowId?.trim()) throw new HttpsError('invalid-argument', 'workflowId is required')

    const db = admin.firestore()
    const apiKey = anthropicApiKey.value()
    const displayName = request.auth?.token?.name as string | undefined

    const result = await runWorkflow(workflowId, userId, db, apiKey, triggerData, displayName)
    return result
  }
)

export const getWorkflowHistoryFn = onCall(
  { secrets: [] },
  async (request: CallableRequest<GetHistoryRequest>) => {
    const userId = requireAuth(request)
    const { workflowId, limit } = request.data
    const db = admin.firestore()
    return getWorkflowHistory(userId, db, workflowId, limit)
  }
)

export const listWorkflowsFn = onCall(
  { secrets: [] },
  async (request: CallableRequest<void>) => {
    requireAuth(request)
    const all = listWorkflows()
    return { workflows: all.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      version: w.version,
      trigger: w.trigger,
      enabled: w.enabled,
      tags: w.tags ?? [],
      stepCount: w.steps.length,
    })) }
  }
)

export const getWorkflowSchedulesFn = onCall(
  { secrets: [] },
  async (request: CallableRequest<void>) => {
    const userId = requireAuth(request)
    const db = admin.firestore()
    return { schedules: await getScheduledWorkflows(userId, db) }
  }
)

export const setWorkflowEnabledFn = onCall(
  { secrets: [] },
  async (request: CallableRequest<SetWorkflowEnabledRequest>) => {
    requireAuth(request)
    const { workflowId, enabled } = request.data
    if (!workflowId?.trim()) throw new HttpsError('invalid-argument', 'workflowId is required')
    workflowRegistry.setEnabled(workflowId, enabled)
    return { workflowId, enabled }
  }
)
