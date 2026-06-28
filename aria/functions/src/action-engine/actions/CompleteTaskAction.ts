import { v4 as uuidv4 } from 'uuid'
import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireString } from '../Validation'
import { ExecutionError } from '../Errors'

export interface CompleteTaskArgs {
  taskId: string
}

export interface CompleteTaskData {
  taskId: string
  completedAt: string
}

export class CompleteTaskAction implements BaseAction<CompleteTaskArgs, CompleteTaskData> {
  readonly toolName = 'completeTask'

  validate(args: CompleteTaskArgs): void {
    requireString(args.taskId, 'taskId')
  }

  async execute(
    args: CompleteTaskArgs,
    ctx: ActionContext
  ): Promise<ActionResult<CompleteTaskData>> {
    const actionId = uuidv4()
    try {
      const taskRef = ctx.db
        .collection('users')
        .doc(ctx.userId)
        .collection('tasks')
        .doc(args.taskId)

      const snap = await taskRef.get()
      if (!snap.exists) {
        throw new Error(`Task "${args.taskId}" not found.`)
      }

      const completedAt = new Date().toISOString()
      await taskRef.update({ completed: true, completedAt, updatedAt: completedAt })

      return successResult(
        actionId,
        'Task marked as complete.',
        { taskId: args.taskId, completedAt },
        elapsedMs(ctx)
      )
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(_args: CompleteTaskArgs, _ctx: ActionContext): Promise<void> {
    // Completion is an intentional user action — no rollback
  }

  audit(
    args: CompleteTaskArgs,
    ctx: ActionContext,
    result: ActionResult<CompleteTaskData>
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
registry.register(new CompleteTaskAction())
