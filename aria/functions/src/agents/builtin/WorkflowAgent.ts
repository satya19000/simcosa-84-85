import type { AgentManifest } from '../Agent'
import type { AgentTask } from '../AgentTask'
import type { AgentResult } from '../AgentResult'
import type { AgentContext } from '../AgentContext'
import { BaseAgent } from './BaseAgent'
import { runWorkflow } from '../../workflows'

export class WorkflowAgent extends BaseAgent {
  readonly manifest: AgentManifest = {
    id: 'workflow-agent',
    name: 'Workflow Agent',
    description: 'Triggers registered workflows via the Workflow Engine',
    version: '1.0.0',
    capabilities: ['workflow'],
  }

  canHandle(task: AgentTask): boolean {
    return task.capability === 'workflow'
  }

  async execute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const startMs = Date.now()
    const workflowId = String(task.input['workflowId'] ?? '')
    const triggerData = task.input['triggerData'] as Record<string, unknown> | undefined

    if (!workflowId) {
      return this.makeErrorResult(task, ctx, 'workflowId is required', startMs)
    }

    try {
      const result = await runWorkflow(
        workflowId,
        ctx.userId,
        ctx.db,
        ctx.apiKey,
        triggerData,
        ctx.userDisplayName
      )

      if (result.status === 'failed') {
        return this.makeErrorResult(task, ctx, result.error ?? 'Workflow failed', startMs)
      }

      return this.makeResult(
        task,
        ctx,
        result,
        `Workflow "${workflowId}" completed with status: ${result.status}`,
        startMs
      )
    } catch (err) {
      return this.makeErrorResult(task, ctx, err, startMs)
    }
  }
}
