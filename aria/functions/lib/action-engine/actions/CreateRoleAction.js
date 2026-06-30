"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRoleAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const security_1 = require("../../security");
const SecurityTypes_1 = require("../../security/SecurityTypes");
const ROLE_SCOPES = ['tenant', 'organization', 'workspace'];
/** Thin wrapper around SecurityEngine.createRole — no raw Firestore writes here. */
class CreateRoleAction {
    constructor() {
        this.toolName = 'createRole';
    }
    validate(args) {
        (0, Validation_1.requireStringMax)(args.tenantId, 'tenantId', 200);
        (0, Validation_1.requireStringMax)(args.name, 'name', 200);
        (0, Validation_1.requireOneOf)(args.scope, 'scope', ROLE_SCOPES);
        if (!Array.isArray(args.permissions) || args.permissions.some((p) => !SecurityTypes_1.PERMISSION_ACTIONS.includes(p))) {
            throw new Errors_1.ValidationError('permissions', `must be an array of valid permission actions`);
        }
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, security_1.getSecurityEngine)(ctx.userId, ctx.db, apiKey);
            const role = await engine.createRole(ctx.userId, args.tenantId, {
                name: args.name,
                scope: args.scope,
                permissions: args.permissions,
                inheritsFrom: args.inheritsFrom ?? null,
            });
            const data = { roleId: role.roleId, name: role.name, scope: role.scope };
            return (0, ActionResult_1.successResult)(role.roleId, `Role "${role.name}" created.`, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback() {
        // Role creation has no automatic safe rollback; best-effort no-op.
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { tenantId: args.tenantId, name: args.name, scope: args.scope },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.CreateRoleAction = CreateRoleAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new CreateRoleAction());
//# sourceMappingURL=CreateRoleAction.js.map