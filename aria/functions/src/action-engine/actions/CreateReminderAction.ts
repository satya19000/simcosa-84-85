import { v4 as uuidv4 } from 'uuid'
import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireStringMax, requireISODate, optionalString, requireOneOf } from '../Validation'
import { ExecutionError } from '../Errors'

const RECURRENCE = ['none', 'daily', 'weekly', 'monthly'] as const
type Recurrence = typeof RECURRENCE[number]

export interface CreateReminderArgs {
  title: string
  scheduledAt: string
  recurrence?: Recurrence
  notes?: string
}

export interface CreateReminderData {
  reminderId: string
  title: string
  scheduledAt: string
  recurrence: Recurrence
  createdAt: string
}

export class CreateReminderAction implements BaseAction<CreateReminderArgs, CreateReminderData> {
  readonly toolName = 'createReminder'

  validate(args: CreateReminderArgs): void {
    requireStringMax(args.title, 'title', 200)
    requireISODate(args.scheduledAt, 'scheduledAt')
    if (args.recurrence !== undefined) requireOneOf(args.recurrence, 'recurrence', RECURRENCE)
    optionalString(args.notes, 'notes')
  }

  async execute(
    args: CreateReminderArgs,
    ctx: ActionContext
  ): Promise<ActionResult<CreateReminderData>> {
    const reminderId = uuidv4()
    try {
      const now = new Date().toISOString()
      const doc = {
        title: args.title.trim(),
        scheduledAt: args.scheduledAt,
        recurrence: args.recurrence ?? 'none',
        notes: args.notes ?? null,
        completed: false,
        notified: false,
        userId: ctx.userId,
        createdAt: now,
        updatedAt: now,
      }

      await ctx.db
        .collection('users')
        .doc(ctx.userId)
        .collection('reminders')
        .doc(reminderId)
        .set(doc)

      const data: CreateReminderData = {
        reminderId,
        title: doc.title,
        scheduledAt: doc.scheduledAt,
        recurrence: doc.recurrence,
        createdAt: now,
      }

      return successResult(
        reminderId,
        `Reminder "${data.title}" set for ${new Date(data.scheduledAt).toLocaleString('en-IN')}.`,
        data,
        elapsedMs(ctx)
      )
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(_args: CreateReminderArgs, _ctx: ActionContext): Promise<void> {
    // No partial write to undo — Firestore set() is atomic
  }

  audit(
    args: CreateReminderArgs,
    ctx: ActionContext,
    result: ActionResult<CreateReminderData>
  ): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: {
        title: args.title,
        scheduledAt: args.scheduledAt,
        recurrence: args.recurrence ?? 'none',
      },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new CreateReminderAction())
