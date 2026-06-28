"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateContactAction = void 0;
const uuid_1 = require("uuid");
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const CONTACT_METHODS = ['phone', 'whatsapp', 'email', 'sms', 'unknown'];
class UpdateContactAction {
    constructor() {
        this.toolName = 'updateContact';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.contactId, 'contactId');
        if (args.name !== undefined)
            (0, Validation_1.requireStringMax)(args.name, 'name', 100);
        if (args.phone !== undefined && args.phone !== null)
            (0, Validation_1.optionalString)(args.phone, 'phone');
        if (args.email !== undefined && args.email !== null)
            (0, Validation_1.optionalString)(args.email, 'email');
        if (args.role !== undefined && args.role !== null)
            (0, Validation_1.optionalString)(args.role, 'role');
        if (args.organization !== undefined && args.organization !== null)
            (0, Validation_1.optionalString)(args.organization, 'organization');
        if (args.relationshipType !== undefined && args.relationshipType !== null)
            (0, Validation_1.optionalString)(args.relationshipType, 'relationshipType');
        if (args.relationshipNotes !== undefined && args.relationshipNotes !== null)
            (0, Validation_1.optionalString)(args.relationshipNotes, 'relationshipNotes');
        if (args.preferredContactMethod !== undefined)
            (0, Validation_1.requireOneOf)(args.preferredContactMethod, 'preferredContactMethod', CONTACT_METHODS);
        if (args.tags !== undefined) {
            if (!Array.isArray(args.tags))
                throw new Errors_1.ValidationError('tags', 'must be an array');
        }
        const updateFields = ['name', 'phone', 'email', 'role', 'organization', 'relationshipType', 'relationshipNotes', 'tags', 'preferredContactMethod', 'lastInteractionAt'];
        const hasUpdate = updateFields.some((f) => args[f] !== undefined);
        if (!hasUpdate)
            throw new Errors_1.ValidationError('args', 'at least one field to update is required');
    }
    async execute(args, ctx) {
        const actionId = (0, uuid_1.v4)();
        try {
            const ref = ctx.db.collection('users').doc(ctx.userId).collection('contacts').doc(args.contactId);
            const snap = await ref.get();
            if (!snap.exists)
                throw new Error(`Contact "${args.contactId}" not found.`);
            const updatedAt = new Date().toISOString();
            const patch = { updatedAt };
            if (args.name !== undefined)
                patch.name = args.name.trim();
            if (args.phone !== undefined)
                patch.phone = args.phone ?? null;
            if (args.email !== undefined)
                patch.email = args.email ?? null;
            if (args.role !== undefined)
                patch.role = args.role ?? null;
            if (args.organization !== undefined)
                patch.organization = args.organization ?? null;
            if (args.relationshipType !== undefined)
                patch.relationshipType = args.relationshipType ?? null;
            if (args.relationshipNotes !== undefined)
                patch.relationshipNotes = args.relationshipNotes ?? null;
            if (args.tags !== undefined)
                patch.tags = args.tags;
            if (args.preferredContactMethod !== undefined)
                patch.preferredContactMethod = args.preferredContactMethod;
            if (args.lastInteractionAt !== undefined)
                patch.lastInteractionAt = args.lastInteractionAt ?? null;
            await ref.update(patch);
            return (0, ActionResult_1.successResult)(actionId, 'Contact updated.', { contactId: args.contactId, updatedAt }, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            if (err instanceof Errors_1.ValidationError)
                throw err;
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
            argsSummary: { contactId: args.contactId, fields: Object.keys(args).filter((k) => k !== 'contactId') },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.UpdateContactAction = UpdateContactAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new UpdateContactAction());
//# sourceMappingURL=UpdateContactAction.js.map