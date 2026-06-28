"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RollbackError = exports.PermissionError = exports.ExecutionError = exports.ToolNotFoundError = exports.ValidationError = exports.ActionEngineError = void 0;
exports.toActionEngineError = toActionEngineError;
/** Base class for all Action Engine errors. Never throw anything else. */
class ActionEngineError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        // Restore prototype chain (required in TypeScript when extending Error)
        Object.setPrototypeOf(this, new.target.prototype);
    }
    toActionError() {
        return { code: this.code, detail: this.message };
    }
}
exports.ActionEngineError = ActionEngineError;
/** Input from Claude failed schema / business-rule validation. */
class ValidationError extends ActionEngineError {
    constructor(field, reason) {
        super(`Validation failed for '${field}': ${reason}`);
        this.code = 'VALIDATION_ERROR';
    }
}
exports.ValidationError = ValidationError;
/** The requested tool name is not in the registry. */
class ToolNotFoundError extends ActionEngineError {
    constructor(toolName) {
        super(`Tool '${toolName}' is not registered in the Action Engine.`);
        this.code = 'TOOL_NOT_FOUND';
    }
}
exports.ToolNotFoundError = ToolNotFoundError;
/** The action ran but encountered a runtime problem. */
class ExecutionError extends ActionEngineError {
    constructor(toolName, cause) {
        const detail = cause instanceof Error ? cause.message : String(cause);
        super(`Execution of '${toolName}' failed: ${detail}`);
        this.code = 'EXECUTION_ERROR';
    }
}
exports.ExecutionError = ExecutionError;
/** The caller does not have permission to run this action. */
class PermissionError extends ActionEngineError {
    constructor(toolName, reason) {
        super(`Permission denied for '${toolName}': ${reason}`);
        this.code = 'PERMISSION_ERROR';
    }
}
exports.PermissionError = PermissionError;
/** Rollback itself failed after a failed execute(). */
class RollbackError extends ActionEngineError {
    constructor(toolName, cause) {
        const detail = cause instanceof Error ? cause.message : String(cause);
        super(`Rollback of '${toolName}' failed: ${detail}`);
        this.code = 'ROLLBACK_ERROR';
    }
}
exports.RollbackError = RollbackError;
/** Narrows an unknown thrown value into a typed ActionEngineError. */
function toActionEngineError(toolName, err) {
    if (err instanceof ActionEngineError)
        return err;
    return new ExecutionError(toolName, err);
}
//# sourceMappingURL=Errors.js.map