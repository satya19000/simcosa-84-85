import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { bootstrap } from './agents'
import type { AgentTask } from './agents/AgentTask'
import type { AgentContext } from './agents/AgentContext'
import { v4 as uuidv4 } from 'uuid'

interface RunAgentRequest {
  tasks: Array<Omit<AgentTask, 'taskId' | 'graphRunId' | 'userId' | 'createdAt' | 'attempts' | 'status'> & {
    taskId?: string
  }>
  sharedVars?: Record<string, unknown>
}

export const runAgentGraph = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 300 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication required')

    const data = request.data as RunAgentRequest
    if (!data.tasks || data.tasks.length === 0) {
      throw new HttpsError('invalid-argument', 'tasks is required and must not be empty')
    }

    const db = admin.firestore()
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? ''
    const graphRunId = uuidv4()
    const now = new Date().toISOString()

    const tasks: AgentTask[] = data.tasks.map((t, i) => ({
      ...t,
      taskId: t.taskId ?? `${graphRunId}-t${i + 1}`,
      graphRunId,
      userId: uid,
      status: 'pending' as const,
      createdAt: now,
      attempts: 0,
      dependsOn: t.dependsOn ?? [],
      priority: t.priority ?? 50,
    }))

    const { orchestrator, scheduler } = await bootstrap()

    // Fire scheduled jobs opportunistically
    await scheduler.tick()

    const baseContext: Omit<AgentContext, 'taskId' | 'agentId' | 'graphRunId'> = {
      userId: uid,
      userDisplayName: request.auth?.token?.['name'] as string | undefined,
      db,
      apiKey,
      sharedVars: data.sharedVars ?? {},
      createdAt: now,
    }

    const result = await orchestrator.run({
      graphRunId,
      userId: uid,
      userDisplayName: baseContext.userDisplayName,
      tasks,
      baseContext,
    })

    return result
  }
)

export const getAgentStatus = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required')

    const { manager } = await bootstrap()
    const manifests = manager.listManifests()
    const stats = manager.stats()

    return { manifests, stats }
  }
)
