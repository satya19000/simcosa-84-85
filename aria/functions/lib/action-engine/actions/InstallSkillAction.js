"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallSkillAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const marketplace_1 = require("../../marketplace");
/** Thin wrapper around MarketplaceEngine.install (the 11-step pipeline lives in SkillInstaller) — no raw Firestore writes here. */
class InstallSkillAction {
    constructor() {
        this.toolName = 'installSkill';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.tenantId, 'tenantId');
        (0, Validation_1.requireString)(args.itemId, 'itemId');
        (0, Validation_1.optionalString)(args.organizationId, 'organizationId');
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, marketplace_1.getMarketplaceEngine)(ctx.userId, ctx.db, apiKey);
            const installation = await engine.install(ctx.userId, {
                tenantId: args.tenantId,
                organizationId: args.organizationId ?? null,
                itemId: args.itemId,
            });
            const data = {
                installationId: installation.installationId,
                status: installation.status,
                approvalRequestId: installation.approvalRequestId,
            };
            const message = installation.approvalRequestId && installation.status === 'submitted'
                ? `Skill install for "${args.itemId}" is pending approval (request ${installation.approvalRequestId}).`
                : `Skill "${args.itemId}" installed.`;
            return (0, ActionResult_1.successResult)(installation.installationId, message, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback(args, ctx) {
        void args;
        void ctx;
        // Best-effort: install partial-failure cleanup is handled inside SkillInstaller itself.
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { tenantId: args.tenantId, itemId: args.itemId },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.InstallSkillAction = InstallSkillAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new InstallSkillAction());
//# sourceMappingURL=InstallSkillAction.js.map