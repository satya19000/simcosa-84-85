import { v4 as uuidv4 } from 'uuid'
import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireString, requireStringMax, optionalString, requireISODate, requireOneOf } from '../Validation'
import { ExecutionError, ValidationError } from '../Errors'

const RECURRENCES = ['none', 'daily', 'weekly', 'monthly'] as const

export interface UpdateReminderArgs {
  reminderId: string
  title?: string
  notes?: string | null
  scheduledAt?: string
  recurrence?: typeof RECURRENCES[number]
}

export interface UpdateReminderData {
  reminderId: string
  updatedAt: string
}

export class UpdateReminderAction implements BaseAction<UpdateReminderArgs, UpdateReminderData> {
  readonly toolName = 'updateReminder'

  validate(args: UpdateReminderArgs): void {
    requireString(args.reminderId, 'reminderId')
    if (args.title !== undefined) requireStringMax(args.title, 'title', 200)
    if (args.notes !== undefined && args.notes !== null) optionalString(args.notes, 'notes')
    if (args.scheduledAt !== undefined) requireISODate(args.scheduledAt, 'scheduledAt')
    if (args.recurrence !== undefined) requireOneOf(args.recurrence, 'recurrence', RECURRENCES)

    const hasUpdate = args.title !== undefined || args.notes !== undefined ||
      args.scheduledAt !== undefined || args.recurrence !== undefined
    if (!hasUpdate) {
      throw new ValidationError('args', 'at least one field to update is required')
    }
  }

  async execute(args: UpdateReminderArgs, ctx: ActionContext): Promise<ActionResult<UpdateReminderData>> {
    const actionId = uuidv4()
    try {
      const reminderRef = ctx.db
        .collection('users').doc(ctx.userId)
        .collection('reminders').doc(args.reminderId)

      const snap = await reminderRef.get()
      if (!snap.exists) throw new Error(`Reminder "${args.reminderId}" not found.`)

      const existing = snap.data() as { scheduledAt?: string }
      const updatedAt = new Date().toISOString()
      const patch: Record<string, unknown> = { updatedAt }

      if (args.title !== undefined) patch.title = args.title.trim()
      if (args.notes !== undefined) patch.notes = args.notes ?? null
      if (args.scheduledAt !== undefined) {
        patch.scheduledAt = args.scheduledAt
        // Reset notified flag when scheduled time changes
        if (existing.scheduledAt !== args.scheduledAt) {
          patch.notified = false
        }
      }
      if (args.recurrence !== undefined) patch.recurrence = args.recurrence

      await reminderRef.update(patch)
      return successResult(actionId, 'Reminder updated.', { reminderId: args.reminderId, updatedAt }, elapsedMs(ctx))
    } catch (err) {
      if (err instanceof ValidationError) throw err
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(_args: UpdateReminderArgs, _ctx: ActionContext): Promise<void> {
    // Updates are intentional — no rollback
  }

  audit(args: UpdateReminderArgs, ctx: ActionContext, result: ActionResult<UpdateReminderData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { reminderId: args.reminderId, fields: Object.keys(args).filter((k) => k !== 'reminderId') },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new UpdateReminderAction())
