import { v4 as uuidv4 } from 'uuid'
import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireString, requireStringMax, optionalString, optionalISODate, requireOneOf } from '../Validation'
import { ExecutionError, ValidationError } from '../Errors'

const PRIORITIES = ['low', 'normal', 'high', 'critical'] as const

export interface UpdateTaskArgs {
  taskId: string
  title?: string
  notes?: string
  category?: string | null
  priority?: typeof PRIORITIES[number]
  dueAt?: string | null
}

export interface UpdateTaskData {
  taskId: string
  updatedAt: string
}

export class UpdateTaskAction implements BaseAction<UpdateTaskArgs, UpdateTaskData> {
  readonly toolName = 'updateTask'

  validate(args: UpdateTaskArgs): void {
    requireString(args.taskId, 'taskId')
    if (args.title !== undefined) requireStringMax(args.title, 'title', 200)
    if (args.notes !== undefined) optionalString(args.notes, 'notes')
    if (args.category !== undefined && args.category !== null) optionalString(args.category, 'category')
    if (args.priority !== undefined) requireOneOf(args.priority, 'priority', PRIORITIES)
    if (args.dueAt !== undefined && args.dueAt !== null) optionalISODate(args.dueAt, 'dueAt')

    const hasUpdate = args.title !== undefined || args.notes !== undefined ||
      args.category !== undefined || args.priority !== undefined || args.dueAt !== undefined
    if (!hasUpdate) {
      throw new ValidationError('args', 'at least one field to update is required')
    }
  }

  async execute(args: UpdateTaskArgs, ctx: ActionContext): Promise<ActionResult<UpdateTaskData>> {
    const actionId = uuidv4()
    try {
      const taskRef = ctx.db
        .collection('users').doc(ctx.userId)
        .collection('tasks').doc(args.taskId)

      const snap = await taskRef.get()
      if (!snap.exists) throw new Error(`Task "${args.taskId}" not found.`)

      const updatedAt = new Date().toISOString()
      const patch: Record<string, unknown> = { updatedAt }
      if (args.title !== undefined) patch.title = args.title.trim()
      if (args.notes !== undefined) patch.notes = args.notes ?? null
      if (args.category !== undefined) patch.category = args.category ?? null
      if (args.priority !== undefined) patch.priority = args.priority
      if (args.dueAt !== undefined) patch.dueAt = args.dueAt ?? null

      await taskRef.update(patch)
      return successResult(actionId, 'Task updated.', { taskId: args.taskId, updatedAt }, elapsedMs(ctx))
    } catch (err) {
      if (err instanceof ValidationError) throw err
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(_args: UpdateTaskArgs, _ctx: ActionContext): Promise<void> {
    // Updates are intentional — no rollback
  }

  audit(args: UpdateTaskArgs, ctx: ActionContext, result: ActionResult<UpdateTaskData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { taskId: args.taskId, fields: Object.keys(args).filter((k) => k !== 'taskId') },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new UpdateTaskAction())
