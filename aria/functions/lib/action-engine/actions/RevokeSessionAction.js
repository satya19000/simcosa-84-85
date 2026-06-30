"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevokeSessionAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const security_1 = require("../../security");
/** Thin wrapper around SecurityEngine.revokeSession — no raw Firestore writes here. */
class RevokeSessionAction {
    constructor() {
        this.toolName = 'revokeSession';
    }
    validate(args) {
        (0, Validation_1.requireStringMax)(args.tenantId, 'tenantId', 200);
        (0, Validation_1.requireStringMax)(args.sessionId, 'sessionId', 200);
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, security_1.getSecurityEngine)(ctx.userId, ctx.db, apiKey);
            const session = await engine.revokeSession(ctx.userId, args.tenantId, args.sessionId);
            const data = { sessionId: args.sessionId, active: session?.active ?? false };
            return (0, ActionResult_1.successResult)(args.sessionId, session ? 'Session revoked.' : 'Session not found.', data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback() {
        // Session revocation is a one-way security action; no rollback by design.
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { tenantId: args.tenantId, sessionId: args.sessionId },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.RevokeSessionAction = RevokeSessionAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new RevokeSessionAction());
//# sourceMappingURL=RevokeSessionAction.js.map