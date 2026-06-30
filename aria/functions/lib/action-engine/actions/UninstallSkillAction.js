"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UninstallSkillAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const marketplace_1 = require("../../marketplace");
/** Thin wrapper around MarketplaceEngine.uninstall — no raw Firestore writes here. */
class UninstallSkillAction {
    constructor() {
        this.toolName = 'uninstallSkill';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.tenantId, 'tenantId');
        (0, Validation_1.requireString)(args.installationId, 'installationId');
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, marketplace_1.getMarketplaceEngine)(ctx.userId, ctx.db, apiKey);
            const updated = await engine.uninstall(ctx.userId, args.tenantId, args.installationId);
            if (!updated) {
                return (0, ActionResult_1.failureResult)(args.installationId, `Installation "${args.installationId}" not found.`, { code: 'EXECUTION_ERROR', detail: 'not found' }, (0, ActionContext_1.elapsedMs)(ctx));
            }
            const data = { installationId: updated.installationId, status: updated.status };
            return (0, ActionResult_1.successResult)(updated.installationId, `Skill installation "${updated.installationId}" uninstalled.`, data, (0, ActionContext_1.elapsedMs)(ctx));
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
            argsSummary: { tenantId: args.tenantId, installationId: args.installationId },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.UninstallSkillAction = UninstallSkillAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new UninstallSkillAction());
//# sourceMappingURL=UninstallSkillAction.js.map