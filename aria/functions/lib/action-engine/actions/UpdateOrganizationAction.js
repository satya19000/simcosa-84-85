"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOrganizationAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const organization_1 = require("../../organization");
class UpdateOrganizationAction {
    constructor() {
        this.toolName = 'updateOrganization';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.organizationId, 'organizationId');
        if (args.name !== undefined)
            (0, Validation_1.requireStringMax)(args.name, 'name', 200);
        (0, Validation_1.optionalString)(args.description, 'description');
    }
    async execute(args, ctx) {
        const actionId = `${args.organizationId}-update-${Date.now()}`;
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, organization_1.getOrganizationEngine)(ctx.userId, ctx.db, apiKey);
            const updated = await engine.updateOrganization(ctx.userId, args.organizationId, {
                name: args.name,
                description: args.description,
            });
            if (!updated) {
                return (0, ActionResult_1.failureResult)(actionId, 'Organization not found', { code: 'EXECUTION_ERROR', detail: 'not found' }, (0, ActionContext_1.elapsedMs)(ctx));
            }
            return (0, ActionResult_1.successResult)(actionId, `Organization "${updated.name}" updated.`, { organizationId: updated.organizationId, name: updated.name }, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback() {
        // No-op: update is not destructive enough to warrant automatic rollback; previous values aren't tracked here.
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { organizationId: args.organizationId, hasName: !!args.name, hasDescription: !!args.description },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.UpdateOrganizationAction = UpdateOrganizationAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new UpdateOrganizationAction());
//# sourceMappingURL=UpdateOrganizationAction.js.map