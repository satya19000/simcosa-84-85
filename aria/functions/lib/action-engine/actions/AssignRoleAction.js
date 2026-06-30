"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignRoleAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const security_1 = require("../../security");
const ROLE_SCOPES = ['tenant', 'organization', 'workspace'];
/** Thin wrapper around SecurityEngine.assignRole — no raw Firestore writes here. */
class AssignRoleAction {
    constructor() {
        this.toolName = 'assignRole';
    }
    validate(args) {
        (0, Validation_1.requireStringMax)(args.tenantId, 'tenantId', 200);
        (0, Validation_1.requireStringMax)(args.identityId, 'identityId', 200);
        (0, Validation_1.requireStringMax)(args.roleId, 'roleId', 200);
        (0, Validation_1.requireOneOf)(args.scope, 'scope', ROLE_SCOPES);
        (0, Validation_1.optionalString)(args.scopeId, 'scopeId');
        (0, Validation_1.optionalISODate)(args.expiresAt, 'expiresAt');
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, security_1.getSecurityEngine)(ctx.userId, ctx.db, apiKey);
            const assignment = await engine.assignRole(ctx.userId, args.tenantId, {
                identityId: args.identityId,
                roleId: args.roleId,
                scope: args.scope,
                scopeId: args.scopeId ?? null,
                expiresAt: args.expiresAt ?? null,
                delegatedBy: ctx.userId,
            });
            const data = { assignmentId: assignment.assignmentId, identityId: assignment.identityId, roleId: assignment.roleId };
            return (0, ActionResult_1.successResult)(assignment.assignmentId, `Role assigned to identity ${assignment.identityId}.`, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, security_1.getSecurityEngine)(ctx.userId, ctx.db, apiKey);
            // Best-effort: nothing to roll back precisely without the assignmentId; no-op.
            void engine;
            void args;
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
            argsSummary: { tenantId: args.tenantId, identityId: args.identityId, roleId: args.roleId, scope: args.scope },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.AssignRoleAction = AssignRoleAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new AssignRoleAction());
//# sourceMappingURL=AssignRoleAction.js.map