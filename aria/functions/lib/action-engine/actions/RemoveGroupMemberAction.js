"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveGroupMemberAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const security_1 = require("../../security");
/** Thin wrapper around SecurityEngine.removeMemberFromGroup — no raw Firestore writes here. */
class RemoveGroupMemberAction {
    constructor() {
        this.toolName = 'removeGroupMember';
    }
    validate(args) {
        (0, Validation_1.requireStringMax)(args.tenantId, 'tenantId', 200);
        (0, Validation_1.requireStringMax)(args.groupId, 'groupId', 200);
        (0, Validation_1.requireStringMax)(args.identityId, 'identityId', 200);
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, security_1.getSecurityEngine)(ctx.userId, ctx.db, apiKey);
            const group = await engine.removeMemberFromGroup(ctx.userId, args.tenantId, args.groupId, args.identityId);
            const data = { groupId: args.groupId, memberIdentityIds: group?.memberIdentityIds ?? [] };
            return (0, ActionResult_1.successResult)(args.groupId, group ? 'Member removed from group.' : 'Group not found.', data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, security_1.getSecurityEngine)(ctx.userId, ctx.db, apiKey);
            await engine.addMemberToGroup(ctx.userId, args.tenantId, args.groupId, args.identityId);
        }
        catch {
            // Rollback is best-effort
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
            argsSummary: { tenantId: args.tenantId, groupId: args.groupId, identityId: args.identityId },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.RemoveGroupMemberAction = RemoveGroupMemberAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new RemoveGroupMemberAction());
//# sourceMappingURL=RemoveGroupMemberAction.js.map