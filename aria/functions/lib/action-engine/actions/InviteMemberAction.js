"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteMemberAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const organization_1 = require("../../organization");
const ROLES = ['owner', 'admin', 'manager', 'supervisor', 'staff', 'guest', 'viewer'];
class InviteMemberAction {
    constructor() {
        this.toolName = 'inviteMember';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.organizationId, 'organizationId');
        if (typeof args.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) {
            throw new Errors_1.ValidationError('email', 'must be a valid email address');
        }
        (0, Validation_1.requireOneOf)(args.role, 'role', ROLES);
        (0, Validation_1.optionalString)(args.workspaceId, 'workspaceId');
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, organization_1.getOrganizationEngine)(ctx.userId, ctx.db, apiKey);
            const invitation = await engine.inviteMember(ctx.userId, args.organizationId, {
                email: args.email,
                role: args.role,
                workspaceId: args.workspaceId ?? null,
            });
            const data = { invitationId: invitation.invitationId, email: invitation.email, role: invitation.role };
            return (0, ActionResult_1.successResult)(invitation.invitationId, `Invited ${invitation.email} as ${invitation.role}.`, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, organization_1.getOrganizationEngine)(ctx.userId, ctx.db, apiKey);
            const invitations = await engine.listInvitations(ctx.userId, args.organizationId);
            const pending = invitations.find((i) => i.email === args.email.trim().toLowerCase() && i.status === 'pending');
            if (pending)
                await engine.revokeInvitation(ctx.userId, args.organizationId, pending.invitationId);
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
            argsSummary: { organizationId: args.organizationId, email: args.email, role: args.role },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.InviteMemberAction = InviteMemberAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new InviteMemberAction());
//# sourceMappingURL=InviteMemberAction.js.map