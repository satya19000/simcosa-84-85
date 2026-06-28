import { v4 as uuidv4 } from 'uuid'
import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireString } from '../Validation'
import { ExecutionError } from '../Errors'

export interface DeleteTaskArgs {
  taskId: string
}

export interface DeleteTaskData {
  taskId: string
  deletedAt: string
}

export class DeleteTaskAction implements BaseAction<DeleteTaskArgs, DeleteTaskData> {
  readonly toolName = 'deleteTask'

  validate(args: DeleteTaskArgs): void {
    requireString(args.taskId, 'taskId')
  }

  async execute(
    args: DeleteTaskArgs,
    ctx: ActionContext
  ): Promise<ActionResult<DeleteTaskData>> {
    const actionId = uuidv4()
    try {
      await ctx.db
        .collection('users')
        .doc(ctx.userId)
        .collection('tasks')
        .doc(args.taskId)
        .delete()

      const deletedAt = new Date().toISOString()
      return successResult(
        actionId,
        'Task deleted.',
        { taskId: args.taskId, deletedAt },
        elapsedMs(ctx)
      )
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(_args: DeleteTaskArgs, _ctx: ActionContext): Promise<void> {
    // Deleted document cannot be recovered — no rollback
  }

  audit(
    args: DeleteTaskArgs,
    ctx: ActionContext,
    result: ActionResult<DeleteTaskData>
  ): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { taskId: args.taskId },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new DeleteTaskAction())
