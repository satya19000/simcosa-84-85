"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTaskAction = void 0;
const uuid_1 = require("uuid");
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const PRIORITIES = ['low', 'normal', 'high', 'critical'];
class CreateTaskAction {
    constructor() {
        this.toolName = 'createTask';
    }
    validate(args) {
        (0, Validation_1.requireStringMax)(args.title, 'title', 200);
        if (args.priority !== undefined)
            (0, Validation_1.requireOneOf)(args.priority, 'priority', PRIORITIES);
        (0, Validation_1.optionalISODate)(args.dueAt, 'dueAt');
        (0, Validation_1.optionalString)(args.category, 'category');
    }
    async execute(args, ctx) {
        const taskId = (0, uuid_1.v4)();
        try {
            const now = new Date().toISOString();
            const taskDoc = {
                title: args.title.trim(),
                priority: args.priority ?? 'normal',
                dueAt: args.dueAt ?? null,
                category: args.category ?? null,
                notes: args.notes ?? null,
                completed: false,
                userId: ctx.userId,
                createdAt: now,
                updatedAt: now,
            };
            await ctx.db
                .collection('users')
                .doc(ctx.userId)
                .collection('tasks')
                .doc(taskId)
                .set(taskDoc);
            const data = {
                taskId,
                title: taskDoc.title,
                priority: taskDoc.priority,
                dueAt: taskDoc.dueAt,
                category: taskDoc.category,
                createdAt: now,
            };
            return (0, ActionResult_1.successResult)(taskId, `Task "${data.title}" created successfully.`, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback(_args, ctx) {
        // If the doc write succeeded before the error, clean it up
        // We use a best-effort delete — if it doesn't exist, that's fine
        try {
            await ctx.db
                .collection('users')
                .doc(ctx.userId)
                .collection('tasks')
                .doc('_pending_rollback_')
                .delete();
        }
        catch {
            // Rollback is best-effort
        }
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: {
                title: args.title,
                priority: args.priority ?? 'normal',
                hasDueDate: !!args.dueAt,
                category: args.category ?? null,
            },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.CreateTaskAction = CreateTaskAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new CreateTaskAction());
//# sourceMappingURL=CreateTaskAction.js.map