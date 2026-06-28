import { v4 as uuidv4 } from 'uuid'
import * as admin from 'firebase-admin'
import type { ActionContext } from './ActionContext'
import { elapsedMs } from './ActionContext'
import type { ActionResult } from './ActionResult'
import { failureResult } from './ActionResult'
import { registry } from './ActionRegistry'
import { toActionEngineError, RollbackError } from './Errors'

/**
 * Single entry point for all tool executions.
 *
 * Order of operations:
 *  1. Resolve tool from registry (ToolNotFoundError if missing)
 *  2. Run validate() — pure, no side-effects
 *  3. Run execute() — may write to Firestore / call APIs
 *  4. On execute() failure: attempt rollback(), then wrap as RollbackError if rollback fails
 *  5. Write audit log to Firestore activityLogs/{actionId}
 *  6. Return ActionResult — never throws to the caller
 */
export class ToolExecutor {
  constructor(private readonly ctx: ActionContext) {}

  async run<TArgs, TData>(
    toolName: string,
    args: TArgs
  ): Promise<ActionResult<TData>> {
    const actionId = uuidv4()
    let result: ActionResult<TData>

    try {
      const action = registry.resolve(toolName)

      // 1. Validate — throws typed error on failure
      action.validate(args)

      // 2. Execute
      result = await action.execute(args, this.ctx)
    } catch (rawErr) {
      const engineErr = toActionEngineError(toolName, rawErr)
      const ms = elapsedMs(this.ctx)

      // 3. Attempt rollback only for execution errors (not validation)
      if (engineErr.code === 'EXECUTION_ERROR' && registry.has(toolName)) {
        try {
          await registry.resolve(toolName).rollback(args, this.ctx)
        } catch (rbErr) {
          // Rollback failure is surfaced as its own error code
          const rollbackErr = new RollbackError(toolName, rbErr)
          result = failureResult(actionId, rollbackErr.message, rollbackErr.toActionError(), ms)
          await this.writeAuditLog(actionId, toolName, args, result)
          return result
        }
      }

      result = failureResult(actionId, engineErr.message, engineErr.toActionError(), ms)
    }

    // 4. Always write audit log
    await this.writeAuditLog(actionId, toolName, args, result)
    return result
  }

  private async writeAuditLog<TArgs, TData>(
    actionId: string,
    toolName: string,
    args: TArgs,
    result: ActionResult<TData>
  ): Promise<void> {
    try {
      const action = registry.has(toolName) ? registry.resolve(toolName) : null
      const record = action
        ? action.audit(args, this.ctx, result)
        : buildFallbackAudit(actionId, toolName, this.ctx, result)

      await this.ctx.db
        .collection('activityLogs')
        .doc(actionId)
        .set(record)
    } catch {
      // Audit log failure must never propagate — silently swallow so the caller still gets their result
    }
  }
}

function buildFallbackAudit<TData>(
  actionId: string,
  toolName: string,
  ctx: ActionContext,
  result: ActionResult<TData>
) {
  return {
    actionId,
    toolName,
    userId: ctx.userId,
    timestamp: ctx.requestTimestamp,
    durationMs: result.executionTimeMs,
    success: result.success,
    argsSummary: {},
    errorCode: result.error?.code ?? null,
    errorDetail: result.error?.detail ?? null,
  }
}

/** Firestore security rules must allow writes to activityLogs only from Cloud Functions. */
export const ACTIVITY_LOGS_COLLECTION = 'activityLogs' as const

/** Helper to query audit logs for a user (used by future admin screens). */
export async function getActivityLogs(
  db: admin.firestore.Firestore,
  userId: string,
  limit = 50
): Promise<admin.firestore.DocumentData[]> {
  const snap = await db
    .collection(ACTIVITY_LOGS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
