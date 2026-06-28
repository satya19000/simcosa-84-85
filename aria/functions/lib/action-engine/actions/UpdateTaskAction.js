"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTaskAction = void 0;
const uuid_1 = require("uuid");
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const PRIORITIES = ['low', 'normal', 'high', 'critical'];
class UpdateTaskAction {
    constructor() {
        this.toolName = 'updateTask';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.taskId, 'taskId');
        if (args.title !== undefined)
            (0, Validation_1.requireStringMax)(args.title, 'title', 200);
        if (args.notes !== undefined)
            (0, Validation_1.optionalString)(args.notes, 'notes');
        if (args.category !== undefined && args.category !== null)
            (0, Validation_1.optionalString)(args.category, 'category');
        if (args.priority !== undefined)
            (0, Validation_1.requireOneOf)(args.priority, 'priority', PRIORITIES);
        if (args.dueAt !== undefined && args.dueAt !== null)
            (0, Validation_1.optionalISODate)(args.dueAt, 'dueAt');
        const hasUpdate = args.title !== undefined || args.notes !== undefined ||
            args.category !== undefined || args.priority !== undefined || args.dueAt !== undefined;
        if (!hasUpdate) {
            throw new Errors_1.ValidationError('args', 'at least one field to update is required');
        }
    }
    async execute(args, ctx) {
        const actionId = (0, uuid_1.v4)();
        try {
            const taskRef = ctx.db
                .collection('users').doc(ctx.userId)
                .collection('tasks').doc(args.taskId);
            const snap = await taskRef.get();
            if (!snap.exists)
                throw new Error(`Task "${args.taskId}" not found.`);
            const updatedAt = new Date().toISOString();
            const patch = { updatedAt };
            if (args.title !== undefined)
                patch.title = args.title.trim();
            if (args.notes !== undefined)
                patch.notes = args.notes ?? null;
            if (args.category !== undefined)
                patch.category = args.category ?? null;
            if (args.priority !== undefined)
                patch.priority = args.priority;
            if (args.dueAt !== undefined)
                patch.dueAt = args.dueAt ?? null;
            await taskRef.update(patch);
            return (0, ActionResult_1.successResult)(actionId, 'Task updated.', { taskId: args.taskId, updatedAt }, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            if (err instanceof Errors_1.ValidationError)
                throw err;
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback(_args, _ctx) {
        // Updates are intentional — no rollback
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { taskId: args.taskId, fields: Object.keys(args).filter((k) => k !== 'taskId') },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.UpdateTaskAction = UpdateTaskAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new UpdateTaskAction());
//# sourceMappingURL=UpdateTaskAction.js.map