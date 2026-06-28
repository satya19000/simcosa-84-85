"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteReminderAction = void 0;
const uuid_1 = require("uuid");
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
class DeleteReminderAction {
    constructor() {
        this.toolName = 'deleteReminder';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.reminderId, 'reminderId');
    }
    async execute(args, ctx) {
        const actionId = (0, uuid_1.v4)();
        try {
            await ctx.db
                .collection('users')
                .doc(ctx.userId)
                .collection('reminders')
                .doc(args.reminderId)
                .delete();
            const deletedAt = new Date().toISOString();
            return (0, ActionResult_1.successResult)(actionId, 'Reminder deleted.', { reminderId: args.reminderId, deletedAt }, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback(_args, _ctx) {
        // No rollback for deletes
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { reminderId: args.reminderId },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.DeleteReminderAction = DeleteReminderAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new DeleteReminderAction());
//# sourceMappingURL=DeleteReminderAction.js.map