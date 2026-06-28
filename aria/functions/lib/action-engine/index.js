"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RollbackError = exports.PermissionError = exports.ExecutionError = exports.ToolNotFoundError = exports.ValidationError = exports.ActionEngineError = exports.registry = exports.ActionEngine = void 0;
// Public API of the Action Engine
var ActionEngine_1 = require("./ActionEngine");
Object.defineProperty(exports, "ActionEngine", { enumerable: true, get: function () { return ActionEngine_1.ActionEngine; } });
var ActionRegistry_1 = require("./ActionRegistry");
Object.defineProperty(exports, "registry", { enumerable: true, get: function () { return ActionRegistry_1.registry; } });
var Errors_1 = require("./Errors");
Object.defineProperty(exports, "ActionEngineError", { enumerable: true, get: function () { return Errors_1.ActionEngineError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return Errors_1.ValidationError; } });
Object.defineProperty(exports, "ToolNotFoundError", { enumerable: true, get: function () { return Errors_1.ToolNotFoundError; } });
Object.defineProperty(exports, "ExecutionError", { enumerable: true, get: function () { return Errors_1.ExecutionError; } });
Object.defineProperty(exports, "PermissionError", { enumerable: true, get: function () { return Errors_1.PermissionError; } });
Object.defineProperty(exports, "RollbackError", { enumerable: true, get: function () { return Errors_1.RollbackError; } });
// Register all built-in actions by importing their modules.
// Each module self-registers via registry.register() at load time.
// To add a new action: create the file and import it here — nothing else changes.
require("./actions/CreateTaskAction");
require("./actions/CreateReminderAction");
require("./actions/CompleteTaskAction");
require("./actions/DeleteTaskAction");
require("./actions/DeleteReminderAction");
//# sourceMappingURL=index.js.map