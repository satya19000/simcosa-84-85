"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionEngine = void 0;
const ActionContext_1 = require("./ActionContext");
const ToolExecutor_1 = require("./ToolExecutor");
/**
 * Public facade for the Action Engine.
 *
 * All Cloud Function handlers call ActionEngine.run() — never ToolExecutor directly.
 * This keeps the public API surface minimal and stable across phases.
 *
 * Example (from a Cloud Function):
 *   const result = await ActionEngine.run({
 *     toolName: 'createTask',
 *     args: { title: 'Call dentist', priority: 'high', dueAt: '2026-07-01T09:00:00Z' },
 *     userId: request.auth.uid,
 *     db: admin.firestore(),
 *   })
 */
class ActionEngine {
    static async run(options) {
        const ctx = (0, ActionContext_1.buildContext)(options.userId, options.userDisplayName, options.db);
        const executor = new ToolExecutor_1.ToolExecutor(ctx);
        return executor.run(options.toolName, options.args);
    }
    /** Returns the list of all registered tool names — used to inject into ARIA system prompt. */
    static listTools() {
        const { registry } = require('./ActionRegistry');
        return registry.listTools();
    }
}
exports.ActionEngine = ActionEngine;
//# sourceMappingURL=ActionEngine.js.map