"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevokeRoleAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const security_1 = require("../../security");
/** Thin wrapper around SecurityEngine.revokeRoleAssignment — no raw Firestore writes here. */
class RevokeRoleAction {
    constructor() {
        this.toolName = 'revokeRole';
    }
    validate(args) {
        (0, Validation_1.requireStringMax)(args.tenantId, 'tenantId', 200);
        (0, Validation_1.requireStringMax)(args.assignmentId, 'assignmentId', 200);
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, security_1.getSecurityEngine)(ctx.userId, ctx.db, apiKey);
            const revoked = await engine.revokeRoleAssignment(ctx.userId, args.tenantId, args.assignmentId);
            const data = { assignmentId: args.assignmentId, revoked };
            return (0, ActionResult_1.successResult)(args.assignmentId, revoked ? 'Role assignment revoked.' : 'Role assignment not found.', data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback() {
        // Revocation has no automatic safe rollback (re-assignment would need full prior args); best-effort no-op.
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { tenantId: args.tenantId, assignmentId: args.assignmentId },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.RevokeRoleAction = RevokeRoleAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new RevokeRoleAction());
//# sourceMappingURL=RevokeRoleAction.js.map