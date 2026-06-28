import type { ActionErrorCode } from './ActionResult'

/** Base class for all Action Engine errors. Never throw anything else. */
export abstract class ActionEngineError extends Error {
  abstract readonly code: ActionErrorCode

  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    // Restore prototype chain (required in TypeScript when extending Error)
    Object.setPrototypeOf(this, new.target.prototype)
  }

  toActionError() {
    return { code: this.code, detail: this.message }
  }
}

/** Input from Claude failed schema / business-rule validation. */
export class ValidationError extends ActionEngineError {
  readonly code = 'VALIDATION_ERROR' as const

  constructor(field: string, reason: string) {
    super(`Validation failed for '${field}': ${reason}`)
  }
}

/** The requested tool name is not in the registry. */
export class ToolNotFoundError extends ActionEngineError {
  readonly code = 'TOOL_NOT_FOUND' as const

  constructor(toolName: string) {
    super(`Tool '${toolName}' is not registered in the Action Engine.`)
  }
}

/** The action ran but encountered a runtime problem. */
export class ExecutionError extends ActionEngineError {
  readonly code = 'EXECUTION_ERROR' as const

  constructor(toolName: string, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause)
    super(`Execution of '${toolName}' failed: ${detail}`)
  }
}

/** The caller does not have permission to run this action. */
export class PermissionError extends ActionEngineError {
  readonly code = 'PERMISSION_ERROR' as const

  constructor(toolName: string, reason: string) {
    super(`Permission denied for '${toolName}': ${reason}`)
  }
}

/** Rollback itself failed after a failed execute(). */
export class RollbackError extends ActionEngineError {
  readonly code = 'ROLLBACK_ERROR' as const

  constructor(toolName: string, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause)
    super(`Rollback of '${toolName}' failed: ${detail}`)
  }
}

/** Narrows an unknown thrown value into a typed ActionEngineError. */
export function toActionEngineError(toolName: string, err: unknown): ActionEngineError {
  if (err instanceof ActionEngineError) return err
  return new ExecutionError(toolName, err)
}
