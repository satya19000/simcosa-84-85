/** Every action in the engine returns exactly this shape. */
export interface ActionResult<T = unknown> {
  /** Whether the action completed without error. */
  success: boolean
  /** Human-readable summary for ARIA to relay back to the user. */
  message: string
  /** Structured payload — shape is action-specific. */
  data: T | null
  /** Present only on failure — never surfaces raw exceptions. */
  error: ActionError | null
  /** Wall-clock milliseconds the execution took. */
  executionTimeMs: number
  /** Stable UUID generated per execution for audit cross-referencing. */
  actionId: string
}

export interface ActionError {
  code: ActionErrorCode
  detail: string
}

export type ActionErrorCode =
  | 'VALIDATION_ERROR'
  | 'TOOL_NOT_FOUND'
  | 'EXECUTION_ERROR'
  | 'PERMISSION_ERROR'
  | 'ROLLBACK_ERROR'

export function successResult<T>(
  actionId: string,
  message: string,
  data: T,
  executionTimeMs: number
): ActionResult<T> {
  return { success: true, message, data, error: null, executionTimeMs, actionId }
}

export function failureResult(
  actionId: string,
  message: string,
  error: ActionError,
  executionTimeMs: number
): ActionResult<never> {
  return { success: false, message, data: null, error, executionTimeMs, actionId }
}
