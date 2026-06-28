"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteTaskAction = void 0;
const uuid_1 = require("uuid");
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
class CompleteTaskAction {
    constructor() {
        this.toolName = 'completeTask';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.taskId, 'taskId');
    }
    async execute(args, ctx) {
        const actionId = (0, uuid_1.v4)();
        try {
            const taskRef = ctx.db
                .collection('users')
                .doc(ctx.userId)
                .collection('tasks')
                .doc(args.taskId);
            const snap = await taskRef.get();
            if (!snap.exists) {
                throw new Error(`Task "${args.taskId}" not found.`);
            }
            const completedAt = new Date().toISOString();
            await taskRef.update({ completed: true, completedAt, updatedAt: completedAt });
            return (0, ActionResult_1.successResult)(actionId, 'Task marked as complete.', { taskId: args.taskId, completedAt }, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback(_args, _ctx) {
        // Completion is an intentional user action — no rollback
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
exports.CompleteTaskAction = CompleteTaskAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new CompleteTaskAction());
//# sourceMappingURL=CompleteTaskAction.js.map