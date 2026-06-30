import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireString, requireStringMax, optionalString } from '../Validation'
import { ExecutionError } from '../Errors'
import { getOrganizationEngine } from '../../organization'

export interface DelegateTaskArgs {
  organizationId: string
  workspaceId: string
  title: string
  description?: string
  assignedTo?: string
}

export interface DelegateTaskData {
  taskId: string
  workspaceId: string
  title: string
}

export class DelegateTaskAction implements BaseAction<DelegateTaskArgs, DelegateTaskData> {
  readonly toolName = 'delegateTask'

  validate(args: DelegateTaskArgs): void {
    requireString(args.organizationId, 'organizationId')
    requireString(args.workspaceId, 'workspaceId')
    requireStringMax(args.title, 'title', 200)
    optionalString(args.description, 'description')
    optionalString(args.assignedTo, 'assignedTo')
  }

  async execute(args: DelegateTaskArgs, ctx: ActionContext): Promise<ActionResult<DelegateTaskData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getOrganizationEngine(ctx.userId, ctx.db, apiKey)
      const task = await engine.delegateTask(ctx.userId, args.organizationId, args.workspaceId, {
        title: args.title,
        description: args.description,
        assignedTo: args.assignedTo ?? null,
      })
      const data: DelegateTaskData = { taskId: task.taskId, workspaceId: task.workspaceId, title: task.title }
      return successResult(task.taskId, `Task "${task.title}" delegated.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {
    // Best-effort no-op — see CreateOrganizationAction for rationale.
  }

  audit(args: DelegateTaskArgs, ctx: ActionContext, result: ActionResult<DelegateTaskData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { organizationId: args.organizationId, workspaceId: args.workspaceId, title: args.title, assignedTo: args.assignedTo ?? null },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new DelegateTaskAction())
