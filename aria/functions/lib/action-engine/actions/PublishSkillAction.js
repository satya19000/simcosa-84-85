"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishSkillAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const marketplace_1 = require("../../marketplace");
const MarketplaceTypes_1 = require("../../marketplace/MarketplaceTypes");
/** Thin wrapper around MarketplaceEngine.publish — no raw Firestore writes here. */
class PublishSkillAction {
    constructor() {
        this.toolName = 'publishSkill';
    }
    validate(args) {
        (0, Validation_1.requireStringMax)(args.name, 'name', 200);
        (0, Validation_1.requireStringMax)(args.slug, 'slug', 100);
        (0, Validation_1.requireStringMax)(args.version, 'version', 20);
        (0, Validation_1.requireStringMax)(args.author, 'author', 200);
        (0, Validation_1.requireStringMax)(args.description, 'description', 2000);
        (0, Validation_1.requireOneOf)(args.category, 'category', MarketplaceTypes_1.MARKETPLACE_CATEGORIES);
        (0, Validation_1.requireOneOf)(args.itemType, 'itemType', MarketplaceTypes_1.MARKETPLACE_ITEM_TYPES);
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, marketplace_1.getMarketplaceEngine)(ctx.userId, ctx.db, apiKey);
            const item = await engine.publish(ctx.userId, {
                name: args.name,
                slug: args.slug,
                version: args.version,
                author: args.author,
                description: args.description,
                category: args.category,
                itemType: args.itemType,
                publisherId: ctx.userId,
                permissions: [],
            });
            const data = { itemId: item.itemId, name: item.manifest.name, status: item.status };
            return (0, ActionResult_1.successResult)(item.itemId, `Skill "${item.manifest.name}" created as draft.`, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback() {
        // No safe automatic rollback for a created marketplace draft.
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { name: args.name, slug: args.slug, category: args.category },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.PublishSkillAction = PublishSkillAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new PublishSkillAction());
//# sourceMappingURL=PublishSkillAction.js.map