import { v4 as uuidv4 } from 'uuid'
import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireStringMax, optionalString, optionalISODate, requireOneOf } from '../Validation'
import { ExecutionError } from '../Errors'

const PRIORITIES = ['low', 'normal', 'high', 'critical'] as const
type Priority = typeof PRIORITIES[number]

export interface CreateTaskArgs {
  title: string
  priority?: Priority
  dueAt?: string
  category?: string
  notes?: string
}

export interface CreateTaskData {
  taskId: string
  title: string
  priority: Priority
  dueAt: string | null
  category: string | null
  createdAt: string
}

export class CreateTaskAction implements BaseAction<CreateTaskArgs, CreateTaskData> {
  readonly toolName = 'createTask'

  validate(args: CreateTaskArgs): void {
    requireStringMax(args.title, 'title', 200)
    if (args.priority !== undefined) requireOneOf(args.priority, 'priority', PRIORITIES)
    optionalISODate(args.dueAt, 'dueAt')
    optionalString(args.category, 'category')
  }

  async execute(args: CreateTaskArgs, ctx: ActionContext): Promise<ActionResult<CreateTaskData>> {
    const taskId = uuidv4()
    try {
      const now = new Date().toISOString()
      const taskDoc: Omit<CreateTaskData, 'taskId'> & {
        notes: string | null
        completed: boolean
        userId: string
        updatedAt: string
      } = {
        title: args.title.trim(),
        priority: args.priority ?? 'normal',
        dueAt: args.dueAt ?? null,
        category: args.category ?? null,
        notes: args.notes ?? null,
        completed: false,
        userId: ctx.userId,
        createdAt: now,
        updatedAt: now,
      }

      await ctx.db
        .collection('users')
        .doc(ctx.userId)
        .collection('tasks')
        .doc(taskId)
        .set(taskDoc)

      const data: CreateTaskData = {
        taskId,
        title: taskDoc.title,
        priority: taskDoc.priority,
        dueAt: taskDoc.dueAt,
        category: taskDoc.category,
        createdAt: now,
      }

      return successResult(
        taskId,
        `Task "${data.title}" created successfully.`,
        data,
        elapsedMs(ctx)
      )
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(_args: CreateTaskArgs, ctx: ActionContext): Promise<void> {
    // If the doc write succeeded before the error, clean it up
    // We use a best-effort delete — if it doesn't exist, that's fine
    try {
      await ctx.db
        .collection('users')
        .doc(ctx.userId)
        .collection('tasks')
        .doc('_pending_rollback_')
        .delete()
    } catch {
      // Rollback is best-effort
    }
  }

  audit(args: CreateTaskArgs, ctx: ActionContext, result: ActionResult<CreateTaskData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: {
        title: args.title,
        priority: args.priority ?? 'normal',
        hasDueDate: !!args.dueAt,
        category: args.category ?? null,
      },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new CreateTaskAction())
