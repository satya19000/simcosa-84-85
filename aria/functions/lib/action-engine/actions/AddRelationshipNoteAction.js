"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddRelationshipNoteAction = void 0;
const uuid_1 = require("uuid");
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const SOURCES = ['chat', 'manual', 'call', 'meeting'];
const IMPORTANCES = ['low', 'normal', 'high'];
class AddRelationshipNoteAction {
    constructor() {
        this.toolName = 'addRelationshipNote';
    }
    validate(args) {
        if (!args.contactId && !args.contactName) {
            throw new Errors_1.ValidationError('contactId/contactName', 'either contactId or contactName is required');
        }
        if (args.contactId)
            (0, Validation_1.requireString)(args.contactId, 'contactId');
        if (args.contactName)
            (0, Validation_1.optionalString)(args.contactName, 'contactName');
        (0, Validation_1.requireStringMax)(args.note, 'note', 2000);
        if (args.importance !== undefined)
            (0, Validation_1.requireOneOf)(args.importance, 'importance', IMPORTANCES);
        if (args.source !== undefined)
            (0, Validation_1.requireOneOf)(args.source, 'source', SOURCES);
    }
    async execute(args, ctx) {
        const memoryId = (0, uuid_1.v4)();
        try {
            let contactId = args.contactId;
            // Resolve by name if only name provided
            if (!contactId && args.contactName) {
                const snap = await ctx.db
                    .collection('users').doc(ctx.userId)
                    .collection('contacts')
                    .where('name', '==', args.contactName.trim())
                    .limit(1)
                    .get();
                if (snap.empty) {
                    throw new Error(`No contact found with name "${args.contactName}". Please create the contact first.`);
                }
                contactId = snap.docs[0].id;
            }
            // Confirm contact exists
            const contactRef = ctx.db.collection('users').doc(ctx.userId).collection('contacts').doc(contactId);
            const contactSnap = await contactRef.get();
            if (!contactSnap.exists) {
                throw new Error(`Contact "${contactId}" not found.`);
            }
            const contactName = contactSnap.data().name;
            const now = new Date().toISOString();
            const memoryDoc = {
                contactId: contactId,
                note: args.note.trim(),
                source: args.source ?? 'chat',
                importance: args.importance ?? 'normal',
                userId: ctx.userId,
                createdAt: now,
            };
            await ctx.db
                .collection('users').doc(ctx.userId)
                .collection('relationshipMemory').doc(memoryId)
                .set(memoryDoc);
            // Also append note to contact's relationshipNotes field
            const existingNotes = contactSnap.data().relationshipNotes ?? '';
            const newNotes = existingNotes
                ? `${existingNotes}\n[${now.slice(0, 10)}] ${args.note.trim()}`
                : `[${now.slice(0, 10)}] ${args.note.trim()}`;
            await contactRef.update({ relationshipNotes: newNotes, updatedAt: now });
            return (0, ActionResult_1.successResult)(memoryId, `Note added to ${contactName}.`, { memoryId, contactId: contactId, createdAt: now }, (0, ActionContext_1.elapsedMs)(ctx));
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
            argsSummary: {
                contactId: args.contactId ?? null,
                contactName: args.contactName ?? null,
                importance: args.importance ?? 'normal',
            },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.AddRelationshipNoteAction = AddRelationshipNoteAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new AddRelationshipNoteAction());
//# sourceMappingURL=AddRelationshipNoteAction.js.map