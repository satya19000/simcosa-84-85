"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateReminderAction = void 0;
const uuid_1 = require("uuid");
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const RECURRENCE = ['none', 'daily', 'weekly', 'monthly'];
class CreateReminderAction {
    constructor() {
        this.toolName = 'createReminder';
    }
    validate(args) {
        (0, Validation_1.requireStringMax)(args.title, 'title', 200);
        (0, Validation_1.requireISODate)(args.scheduledAt, 'scheduledAt');
        if (args.recurrence !== undefined)
            (0, Validation_1.requireOneOf)(args.recurrence, 'recurrence', RECURRENCE);
        (0, Validation_1.optionalString)(args.notes, 'notes');
    }
    async execute(args, ctx) {
        const reminderId = (0, uuid_1.v4)();
        try {
            const now = new Date().toISOString();
            const doc = {
                title: args.title.trim(),
                scheduledAt: args.scheduledAt,
                recurrence: args.recurrence ?? 'none',
                notes: args.notes ?? null,
                completed: false,
                notified: false,
                userId: ctx.userId,
                createdAt: now,
                updatedAt: now,
            };
            await ctx.db
                .collection('users')
                .doc(ctx.userId)
                .collection('reminders')
                .doc(reminderId)
                .set(doc);
            const data = {
                reminderId,
                title: doc.title,
                scheduledAt: doc.scheduledAt,
                recurrence: doc.recurrence,
                createdAt: now,
            };
            return (0, ActionResult_1.successResult)(reminderId, `Reminder "${data.title}" set for ${new Date(data.scheduledAt).toLocaleString('en-IN')}.`, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback(_args, _ctx) {
        // No partial write to undo — Firestore set() is atomic
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
                scheduledAt: args.scheduledAt,
                recurrence: args.recurrence ?? 'none',
            },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.CreateReminderAction = CreateReminderAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new CreateReminderAction());
//# sourceMappingURL=CreateReminderAction.js.map