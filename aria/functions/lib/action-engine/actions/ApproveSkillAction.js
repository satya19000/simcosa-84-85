"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApproveSkillAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const marketplace_1 = require("../../marketplace");
/** Thin wrapper around MarketplaceEngine.approve — no raw Firestore writes here. */
class ApproveSkillAction {
    constructor() {
        this.toolName = 'approveSkill';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.itemId, 'itemId');
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, marketplace_1.getMarketplaceEngine)(ctx.userId, ctx.db, apiKey);
            const updated = await engine.approve(args.itemId);
            if (!updated) {
                return (0, ActionResult_1.failureResult)(args.itemId, `Skill "${args.itemId}" not found.`, { code: 'EXECUTION_ERROR', detail: 'not found' }, (0, ActionContext_1.elapsedMs)(ctx));
            }
            const data = { itemId: updated.itemId, status: updated.status };
            return (0, ActionResult_1.successResult)(updated.itemId, `Skill "${updated.itemId}" approved and published.`, data, (0, ActionContext_1.elapsedMs)(ctx));
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
exports.ApproveSkillAction = ApproveSkillAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new ApproveSkillAction());
//# sourceMappingURL=ApproveSkillAction.js.map