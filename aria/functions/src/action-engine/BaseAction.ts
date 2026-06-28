import type { ActionContext } from './ActionContext'
import type { ActionResult } from './ActionResult'

/**
 * Contract every ARIA action must fulfil.
 *
 * Lifecycle enforced by ToolExecutor:
 *   1. validate()  — pure, throws ValidationError on bad input
 *   2. execute()   — writes to Firestore, calls APIs, etc.
 *   3. rollback()  — called only if execute() throws; best-effort undo
 *   4. audit()     — called after every execution (success or failure) for logging
 */
export interface BaseAction<TArgs = unknown, TData = unknown> {
  /** Stable identifier matching the tool name in the registry. */
  readonly toolName: string

  /**
   * Validate arguments against business rules.
   * Must throw ValidationError for any invalid input.
   * Must NOT have side-effects.
   */
  validate(args: TArgs): void

  /**
   * Execute the action. May read from and write to Firestore.
   * Must return ActionResult — never throw (catch internally and return failureResult).
   */
  execute(args: TArgs, ctx: ActionContext): Promise<ActionResult<TData>>

  /**
   * Attempt to undo the effects of execute() when it fails mid-way.
   * Rollback failures are caught by ToolExecutor and wrapped in RollbackError.
   * Should be a no-op if nothing was written.
   */
  rollback(args: TArgs, ctx: ActionContext): Promise<void>

  /**
   * Return a structured audit record for this invocation.
   * Called after both success and failure. Must not throw.
   */
  audit(args: TArgs, ctx: ActionContext, result: ActionResult<TData>): AuditRecord
}

/** Stored in Firestore activityLogs/{logId}. */
export interface AuditRecord {
  actionId: string
  toolName: string
  userId: string
  timestamp: string
  durationMs: number
  success: boolean
  /** Serialised subset of args — omit secrets/PII before writing. */
  argsSummary: Record<string, unknown>
  errorCode: string | null
  errorDetail: string | null
}
