"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcceptInvitationAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const organization_1 = require("../../organization");
class AcceptInvitationAction {
    constructor() {
        this.toolName = 'acceptInvitation';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.organizationId, 'organizationId');
        (0, Validation_1.requireString)(args.invitationId, 'invitationId');
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, organization_1.getOrganizationEngine)(ctx.userId, ctx.db, apiKey);
            const member = await engine.acceptInvitation(ctx.userId, args.organizationId, args.invitationId, {
                displayName: ctx.userDisplayName ?? 'New member',
                email: '',
            });
            const data = { organizationId: args.organizationId, memberId: member.memberId, role: member.role };
            return (0, ActionResult_1.successResult)(member.memberId, `Joined organization as ${member.role}.`, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, organization_1.getOrganizationEngine)(ctx.userId, ctx.db, apiKey);
            const member = await engine.permissionsApi.getMembership(args.organizationId, ctx.userId);
            if (member)
                await engine.removeMember(ctx.userId, args.organizationId, member.memberId);
        }
        catch {
            // best-effort
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
            argsSummary: { organizationId: args.organizationId, invitationId: args.invitationId },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.AcceptInvitationAction = AcceptInvitationAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new AcceptInvitationAction());
//# sourceMappingURL=AcceptInvitationAction.js.map