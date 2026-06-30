"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePolicyAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const security_1 = require("../../security");
const POLICY_RESULTS = ['allow', 'deny', 'requireApproval', 'requireElevatedRole', 'auditOnly'];
/** Thin wrapper around SecurityEngine.updatePolicy — no raw Firestore writes here. */
class UpdatePolicyAction {
    constructor() {
        this.toolName = 'updatePolicy';
    }
    validate(args) {
        (0, Validation_1.requireStringMax)(args.tenantId, 'tenantId', 200);
        (0, Validation_1.requireStringMax)(args.policyId, 'policyId', 200);
        (0, Validation_1.optionalString)(args.name, 'name');
        (0, Validation_1.optionalString)(args.description, 'description');
        if (args.result !== undefined && !POLICY_RESULTS.includes(args.result)) {
            throw new Errors_1.ValidationError('result', `must be one of: ${POLICY_RESULTS.join(', ')}`);
        }
        (0, Validation_1.optionalString)(args.requiredRole, 'requiredRole');
        if (args.enabled !== undefined)
            (0, Validation_1.requireBoolean)(args.enabled, 'enabled');
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, security_1.getSecurityEngine)(ctx.userId, ctx.db, apiKey);
            const updated = await engine.updatePolicy(ctx.userId, args.tenantId, args.policyId, {
                name: args.name,
                description: args.description,
                result: args.result,
                requiredRole: args.requiredRole,
                enabled: args.enabled,
            });
            if (!updated) {
                const data = { policyId: args.policyId, result: 'deny', enabled: false };
                return (0, ActionResult_1.successResult)(args.policyId, 'Policy not found.', data, (0, ActionContext_1.elapsedMs)(ctx));
            }
            const data = { policyId: updated.policyId, result: updated.result, enabled: updated.enabled };
            return (0, ActionResult_1.successResult)(updated.policyId, `Policy "${updated.name}" updated.`, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback() {
        // Policy update has no automatic safe rollback (prior values not tracked here); best-effort no-op.
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { tenantId: args.tenantId, policyId: args.policyId },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.UpdatePolicyAction = UpdatePolicyAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new UpdatePolicyAction());
//# sourceMappingURL=UpdatePolicyAction.js.map