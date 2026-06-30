"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrantSkillPermissionAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const marketplace_1 = require("../../marketplace");
const MarketplaceTypes_1 = require("../../marketplace/MarketplaceTypes");
/** Thin wrapper around MarketplaceEngine.grantPermission — no raw Firestore writes here. */
class GrantSkillPermissionAction {
    constructor() {
        this.toolName = 'grantSkillPermission';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.tenantId, 'tenantId');
        (0, Validation_1.requireString)(args.installationId, 'installationId');
        (0, Validation_1.requireString)(args.itemId, 'itemId');
        if (!Array.isArray(args.scopes) || args.scopes.some((s) => !MarketplaceTypes_1.SKILL_PERMISSION_SCOPES.includes(s))) {
            throw new Errors_1.ValidationError('scopes', `must be an array of valid permission scopes: ${MarketplaceTypes_1.SKILL_PERMISSION_SCOPES.join(', ')}`);
        }
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, marketplace_1.getMarketplaceEngine)(ctx.userId, ctx.db, apiKey);
            const grants = await engine.grantPermission(args.tenantId, ctx.userId, args.installationId, args.itemId, args.scopes);
            const data = { installationId: args.installationId, grantedCount: grants.length };
            return (0, ActionResult_1.successResult)(args.installationId, `Granted ${grants.length} permission scope(s) to installation "${args.installationId}".`, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback() { }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { tenantId: args.tenantId, installationId: args.installationId, scopes: args.scopes },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.GrantSkillPermissionAction = GrantSkillPermissionAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new GrantSkillPermissionAction());
//# sourceMappingURL=GrantSkillPermissionAction.js.map