"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewSkillAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const marketplace_1 = require("../../marketplace");
/** Thin wrapper around MarketplaceEngine.recordReview — no raw Firestore writes here. */
class ReviewSkillAction {
    constructor() {
        this.toolName = 'reviewSkill';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.itemId, 'itemId');
        (0, Validation_1.requireStringMax)(args.reviewText, 'reviewText', 4000);
        (0, Validation_1.requireString)(args.versionReviewed, 'versionReviewed');
        if (typeof args.rating !== 'number' || args.rating < 1 || args.rating > 5) {
            throw new Errors_1.ValidationError('rating', 'must be a number between 1 and 5');
        }
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, marketplace_1.getMarketplaceEngine)(ctx.userId, ctx.db, apiKey);
            const review = await engine.recordReview(ctx.userId, args.itemId, {
                rating: args.rating,
                reviewText: args.reviewText,
                versionReviewed: args.versionReviewed,
            });
            const data = { reviewId: review.reviewId, itemId: review.itemId, rating: review.rating };
            return (0, ActionResult_1.successResult)(review.reviewId, `Review submitted for skill "${args.itemId}".`, data, (0, ActionContext_1.elapsedMs)(ctx));
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
            argsSummary: { itemId: args.itemId, rating: args.rating },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.ReviewSkillAction = ReviewSkillAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new ReviewSkillAction());
//# sourceMappingURL=ReviewSkillAction.js.map