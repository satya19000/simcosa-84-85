"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTenantAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const security_1 = require("../../security");
const TENANT_TYPES = ['personal', 'organization', 'enterprise', 'government', 'healthcare', 'education'];
/** Thin wrapper around SecurityEngine.createTenant — no raw Firestore writes here. */
class CreateTenantAction {
    constructor() {
        this.toolName = 'createTenant';
    }
    validate(args) {
        (0, Validation_1.requireStringMax)(args.name, 'name', 200);
        (0, Validation_1.requireOneOf)(args.tenantType, 'tenantType', TENANT_TYPES);
        (0, Validation_1.optionalString)(args.organizationId, 'organizationId');
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, security_1.getSecurityEngine)(ctx.userId, ctx.db, apiKey);
            const tenant = await engine.createTenant(ctx.userId, {
                name: args.name,
                tenantType: args.tenantType,
                organizationId: args.organizationId ?? null,
            });
            const data = { tenantId: tenant.tenantId, name: tenant.name, tenantType: tenant.tenantType };
            return (0, ActionResult_1.successResult)(tenant.tenantId, `Tenant "${tenant.name}" created.`, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback() {
        // Tenant creation seeds roles + first identity atomically-ish; no safe automatic rollback, mirrors CreateOrganizationAction.
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { name: args.name, tenantType: args.tenantType },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.CreateTenantAction = CreateTenantAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new CreateTenantAction());
//# sourceMappingURL=CreateTenantAction.js.map