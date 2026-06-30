"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveMemberAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const organization_1 = require("../../organization");
class RemoveMemberAction {
    constructor() {
        this.toolName = 'removeMember';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.organizationId, 'organizationId');
        (0, Validation_1.requireString)(args.memberId, 'memberId');
    }
    async execute(args, ctx) {
        const actionId = `${args.memberId}-remove-${Date.now()}`;
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, organization_1.getOrganizationEngine)(ctx.userId, ctx.db, apiKey);
            const removed = await engine.removeMember(ctx.userId, args.organizationId, args.memberId);
            if (!removed) {
                return (0, ActionResult_1.failureResult)(actionId, 'Member not found', { code: 'EXECUTION_ERROR', detail: 'not found' }, (0, ActionContext_1.elapsedMs)(ctx));
            }
            return (0, ActionResult_1.successResult)(actionId, `Member ${removed.displayName} removed.`, { organizationId: args.organizationId, memberId: args.memberId }, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback(_args, _ctx) {
        // Best-effort no-op: removal is a soft status flip (status: 'removed'); there is no
        // automatic "re-add" path here because role/workspaceIds at time of removal aren't tracked
        // separately. An admin can re-invite the member manually if removal was a mistake.
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { organizationId: args.organizationId, memberId: args.memberId },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.RemoveMemberAction = RemoveMemberAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new RemoveMemberAction());
//# sourceMappingURL=RemoveMemberAction.js.map