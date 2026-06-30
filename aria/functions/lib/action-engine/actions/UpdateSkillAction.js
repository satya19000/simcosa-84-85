"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSkillAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const marketplace_1 = require("../../marketplace");
/** Thin wrapper around MarketplaceEngine.updateSkill — no raw Firestore writes here. */
class UpdateSkillAction {
    constructor() {
        this.toolName = 'updateSkill';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.itemId, 'itemId');
        (0, Validation_1.optionalString)(args.description, 'description');
        (0, Validation_1.optionalString)(args.version, 'version');
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, marketplace_1.getMarketplaceEngine)(ctx.userId, ctx.db, apiKey);
            const updated = await engine.updateSkill(args.itemId, {
                ...(args.description ? { description: args.description } : {}),
                ...(args.version ? { version: args.version } : {}),
            });
            if (!updated) {
                return (0, ActionResult_1.failureResult)(args.itemId, `Skill "${args.itemId}" not found.`, { code: 'EXECUTION_ERROR', detail: 'not found' }, (0, ActionContext_1.elapsedMs)(ctx));
            }
            const data = { itemId: updated.itemId, status: updated.status };
            return (0, ActionResult_1.successResult)(updated.itemId, `Skill "${updated.itemId}" updated.`, data, (0, ActionContext_1.elapsedMs)(ctx));
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
            argsSummary: { itemId: args.itemId },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.UpdateSkillAction = UpdateSkillAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new UpdateSkillAction());
//# sourceMappingURL=UpdateSkillAction.js.map