import { v4 as uuidv4 } from 'uuid'
import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireString } from '../Validation'
import { ExecutionError } from '../Errors'

export interface DeleteReminderArgs {
  reminderId: string
}

export interface DeleteReminderData {
  reminderId: string
  deletedAt: string
}

export class DeleteReminderAction implements BaseAction<DeleteReminderArgs, DeleteReminderData> {
  readonly toolName = 'deleteReminder'

  validate(args: DeleteReminderArgs): void {
    requireString(args.reminderId, 'reminderId')
  }

  async execute(
    args: DeleteReminderArgs,
    ctx: ActionContext
  ): Promise<ActionResult<DeleteReminderData>> {
    const actionId = uuidv4()
    try {
      await ctx.db
        .collection('users')
        .doc(ctx.userId)
        .collection('reminders')
        .doc(args.reminderId)
        .delete()

      const deletedAt = new Date().toISOString()
      return successResult(
        actionId,
        'Reminder deleted.',
        { reminderId: args.reminderId, deletedAt },
        elapsedMs(ctx)
      )
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(_args: DeleteReminderArgs, _ctx: ActionContext): Promise<void> {
    // No rollback for deletes
  }

  audit(
    args: DeleteReminderArgs,
    ctx: ActionContext,
    result: ActionResult<DeleteReminderData>
  ): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { reminderId: args.reminderId },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new DeleteReminderAction())
