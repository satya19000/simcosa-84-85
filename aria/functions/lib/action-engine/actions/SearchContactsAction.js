"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchContactsAction = void 0;
const uuid_1 = require("uuid");
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
class SearchContactsAction {
    constructor() {
        this.toolName = 'searchContacts';
    }
    validate(args) {
        (0, Validation_1.requireStringMax)(args.query, 'query', 200);
    }
    async execute(args, ctx) {
        const actionId = (0, uuid_1.v4)();
        try {
            const q = args.query.trim().toLowerCase();
            const snap = await ctx.db
                .collection('users').doc(ctx.userId)
                .collection('contacts')
                .orderBy('name')
                .get();
            const results = [];
            for (const doc of snap.docs) {
                const d = doc.data();
                const name = (d.name ?? '').toLowerCase();
                const role = (d.role ?? '').toLowerCase();
                const org = (d.organization ?? '').toLowerCase();
                const relType = (d.relationshipType ?? '').toLowerCase();
                const notes = (d.relationshipNotes ?? '').toLowerCase();
                const tags = (d.tags ?? []).join(' ').toLowerCase();
                if (name.includes(q) || role.includes(q) || org.includes(q) ||
                    relType.includes(q) || notes.includes(q) || tags.includes(q)) {
                    results.push({
                        contactId: doc.id,
                        name: d.name,
                        role: d.role ?? null,
                        organization: d.organization ?? null,
                        phone: d.phone ?? null,
                        email: d.email ?? null,
                        relationshipType: d.relationshipType ?? null,
                        relationshipNotes: d.relationshipNotes ?? null,
                        preferredContactMethod: d.preferredContactMethod ?? null,
                        tags: d.tags ?? [],
                    });
                }
            }
            const label = results.length === 0
                ? `No contacts found matching "${args.query}".`
                : `Found ${results.length} contact${results.length > 1 ? 's' : ''} matching "${args.query}".`;
            return (0, ActionResult_1.successResult)(actionId, label, { results, total: results.length }, (0, ActionContext_1.elapsedMs)(ctx));
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
            argsSummary: { query: args.query, hits: result.data?.total ?? 0 },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.SearchContactsAction = SearchContactsAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new SearchContactsAction());
//# sourceMappingURL=SearchContactsAction.js.map