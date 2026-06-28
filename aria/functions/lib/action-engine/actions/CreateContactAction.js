"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateContactAction = void 0;
const uuid_1 = require("uuid");
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const CONTACT_METHODS = ['phone', 'whatsapp', 'email', 'sms', 'unknown'];
class CreateContactAction {
    constructor() {
        this.toolName = 'createContact';
    }
    validate(args) {
        (0, Validation_1.requireStringMax)(args.name, 'name', 100);
        (0, Validation_1.optionalString)(args.phone, 'phone');
        (0, Validation_1.optionalString)(args.email, 'email');
        (0, Validation_1.optionalString)(args.role, 'role');
        (0, Validation_1.optionalString)(args.organization, 'organization');
        (0, Validation_1.optionalString)(args.relationshipType, 'relationshipType');
        (0, Validation_1.optionalString)(args.relationshipNotes, 'relationshipNotes');
        if (args.preferredContactMethod !== undefined) {
            (0, Validation_1.requireOneOf)(args.preferredContactMethod, 'preferredContactMethod', CONTACT_METHODS);
        }
        if (args.tags !== undefined) {
            if (!Array.isArray(args.tags))
                throw new Errors_1.ValidationError('tags', 'must be an array if provided');
            for (const tag of args.tags) {
                if (typeof tag !== 'string')
                    throw new Errors_1.ValidationError('tags', 'all tags must be strings');
            }
        }
    }
    async execute(args, ctx) {
        const contactId = (0, uuid_1.v4)();
        try {
            const now = new Date().toISOString();
            const doc = {
                name: args.name.trim(),
                phone: args.phone ?? null,
                email: args.email ?? null,
                role: args.role ?? null,
                organization: args.organization ?? null,
                relationshipType: args.relationshipType ?? null,
                relationshipNotes: args.relationshipNotes ?? null,
                tags: args.tags ?? [],
                preferredContactMethod: args.preferredContactMethod ?? 'unknown',
                lastInteractionAt: null,
                userId: ctx.userId,
                createdAt: now,
                updatedAt: now,
            };
            await ctx.db
                .collection('users').doc(ctx.userId)
                .collection('contacts').doc(contactId)
                .set(doc);
            return (0, ActionResult_1.successResult)(contactId, `Contact "${args.name.trim()}" saved.`, { contactId, name: args.name.trim(), createdAt: now }, (0, ActionContext_1.elapsedMs)(ctx));
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
            argsSummary: { name: args.name, hasPhone: !!args.phone, hasEmail: !!args.email },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.CreateContactAction = CreateContactAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new CreateContactAction());
//# sourceMappingURL=CreateContactAction.js.map