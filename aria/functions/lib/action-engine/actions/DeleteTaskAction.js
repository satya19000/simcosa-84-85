"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteTaskAction = void 0;
const uuid_1 = require("uuid");
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
class DeleteTaskAction {
    constructor() {
        this.toolName = 'deleteTask';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.taskId, 'taskId');
    }
    async execute(args, ctx) {
        const actionId = (0, uuid_1.v4)();
        try {
            await ctx.db
                .collection('users')
                .doc(ctx.userId)
                .collection('tasks')
                .doc(args.taskId)
                .delete();
            const deletedAt = new Date().toISOString();
            return (0, ActionResult_1.successResult)(actionId, 'Task deleted.', { taskId: args.taskId, deletedAt }, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback(_args, _ctx) {
        // Deleted document cannot be recovered — no rollback
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { taskId: args.taskId },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.DeleteTaskAction = DeleteTaskAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new DeleteTaskAction());
//# sourceMappingURL=DeleteTaskAction.js.map