"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePolicyAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const security_1 = require("../../security");
const SecurityTypes_1 = require("../../security/SecurityTypes");
const POLICY_RESULTS = ['allow', 'deny', 'requireApproval', 'requireElevatedRole', 'auditOnly'];
/** Thin wrapper around SecurityEngine.createPolicy — no raw Firestore writes here. */
class CreatePolicyAction {
    constructor() {
        this.toolName = 'createPolicy';
    }
    validate(args) {
        (0, Validation_1.requireStringMax)(args.tenantId, 'tenantId', 200);
        (0, Validation_1.requireStringMax)(args.name, 'name', 200);
        (0, Validation_1.requireString)(args.description, 'description');
        (0, Validation_1.requireOneOf)(args.action, 'action', SecurityTypes_1.PERMISSION_ACTIONS);
        (0, Validation_1.requireOneOf)(args.result, 'result', POLICY_RESULTS);
        (0, Validation_1.optionalString)(args.requiredRole, 'requiredRole');
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, security_1.getSecurityEngine)(ctx.userId, ctx.db, apiKey);
            const policy = await engine.createPolicy(ctx.userId, args.tenantId, {
                name: args.name,
                description: args.description,
                action: args.action,
                result: args.result,
                requiredRole: args.requiredRole ?? null,
            });
            const data = { policyId: policy.policyId, name: policy.name, result: policy.result };
            return (0, ActionResult_1.successResult)(policy.policyId, `Policy "${policy.name}" created.`, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback() {
        // Policy creation has no automatic safe rollback; best-effort no-op.
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { tenantId: args.tenantId, name: args.name, action: args.action, result: args.result },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.CreatePolicyAction = CreatePolicyAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new CreatePolicyAction());
//# sourceMappingURL=CreatePolicyAction.js.map