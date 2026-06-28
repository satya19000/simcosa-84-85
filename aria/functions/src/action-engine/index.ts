// Public API of the Action Engine
export { ActionEngine } from './ActionEngine'
export { registry } from './ActionRegistry'
export type { ActionResult, ActionError, ActionErrorCode } from './ActionResult'
export type { ActionContext } from './ActionContext'
export type { BaseAction, AuditRecord } from './BaseAction'
export {
  ActionEngineError,
  ValidationError,
  ToolNotFoundError,
  ExecutionError,
  PermissionError,
  RollbackError,
} from './Errors'

// Register all built-in actions by importing their modules.
// Each module self-registers via registry.register() at load time.
// To add a new action: create the file and import it here — nothing else changes.
import './actions/CreateTaskAction'
import './actions/CreateReminderAction'
