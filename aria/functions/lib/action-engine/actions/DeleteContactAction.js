"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteContactAction = void 0;
const uuid_1 = require("uuid");
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
class DeleteContactAction {
    constructor() {
        this.toolName = 'deleteContact';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.contactId, 'contactId');
    }
    async execute(args, ctx) {
        const actionId = (0, uuid_1.v4)();
        try {
            const ref = ctx.db.collection('users').doc(ctx.userId).collection('contacts').doc(args.contactId);
            const snap = await ref.get();
            if (!snap.exists)
                throw new Error(`Contact "${args.contactId}" not found.`);
            await ref.delete();
            return (0, ActionResult_1.successResult)(actionId, 'Contact deleted.', { contactId: args.contactId }, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback(_args, _ctx) { }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { contactId: args.contactId },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.DeleteContactAction = DeleteContactAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new DeleteContactAction());
//# sourceMappingURL=DeleteContactAction.js.map