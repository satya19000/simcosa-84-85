"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateReminderAction = void 0;
const uuid_1 = require("uuid");
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const RECURRENCES = ['none', 'daily', 'weekly', 'monthly'];
class UpdateReminderAction {
    constructor() {
        this.toolName = 'updateReminder';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.reminderId, 'reminderId');
        if (args.title !== undefined)
            (0, Validation_1.requireStringMax)(args.title, 'title', 200);
        if (args.notes !== undefined && args.notes !== null)
            (0, Validation_1.optionalString)(args.notes, 'notes');
        if (args.scheduledAt !== undefined)
            (0, Validation_1.requireISODate)(args.scheduledAt, 'scheduledAt');
        if (args.recurrence !== undefined)
            (0, Validation_1.requireOneOf)(args.recurrence, 'recurrence', RECURRENCES);
        const hasUpdate = args.title !== undefined || args.notes !== undefined ||
            args.scheduledAt !== undefined || args.recurrence !== undefined;
        if (!hasUpdate) {
            throw new Errors_1.ValidationError('args', 'at least one field to update is required');
        }
    }
    async execute(args, ctx) {
        const actionId = (0, uuid_1.v4)();
        try {
            const reminderRef = ctx.db
                .collection('users').doc(ctx.userId)
                .collection('reminders').doc(args.reminderId);
            const snap = await reminderRef.get();
            if (!snap.exists)
                throw new Error(`Reminder "${args.reminderId}" not found.`);
            const existing = snap.data();
            const updatedAt = new Date().toISOString();
            const patch = { updatedAt };
            if (args.title !== undefined)
                patch.title = args.title.trim();
            if (args.notes !== undefined)
                patch.notes = args.notes ?? null;
            if (args.scheduledAt !== undefined) {
                patch.scheduledAt = args.scheduledAt;
                // Reset notified flag when scheduled time changes
                if (existing.scheduledAt !== args.scheduledAt) {
                    patch.notified = false;
                }
            }
            if (args.recurrence !== undefined)
                patch.recurrence = args.recurrence;
            await reminderRef.update(patch);
            return (0, ActionResult_1.successResult)(actionId, 'Reminder updated.', { reminderId: args.reminderId, updatedAt }, (0, ActionContext_1.elapsedMs)(ctx));
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
            argsSummary: { reminderId: args.reminderId, fields: Object.keys(args).filter((k) => k !== 'reminderId') },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.UpdateReminderAction = UpdateReminderAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new UpdateReminderAction());
//# sourceMappingURL=UpdateReminderAction.js.map