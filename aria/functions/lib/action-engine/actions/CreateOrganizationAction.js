"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateOrganizationAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const organization_1 = require("../../organization");
const ORG_TYPES = ['personal', 'team', 'department', 'hospital', 'government_office', 'enterprise'];
/** Thin wrapper around OrganizationEngine.createOrganization — no raw Firestore writes here. */
class CreateOrganizationAction {
    constructor() {
        this.toolName = 'createOrganization';
    }
    validate(args) {
        (0, Validation_1.requireStringMax)(args.name, 'name', 200);
        (0, Validation_1.requireOneOf)(args.type, 'type', ORG_TYPES);
        (0, Validation_1.optionalString)(args.description, 'description');
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, organization_1.getOrganizationEngine)(ctx.userId, ctx.db, apiKey);
            const org = await engine.createOrganization(ctx.userId, {
                name: args.name,
                type: args.type,
                description: args.description,
            });
            const data = { organizationId: org.organizationId, name: org.name, type: org.type };
            return (0, ActionResult_1.successResult)(org.organizationId, `Organization "${org.name}" created.`, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback() {
        // Organization creation has no safe automatic rollback (would orphan member records mid-flight
        // in edge cases); best-effort no-op, mirroring CreateTaskAction's documented intentional limitation.
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { name: args.name, type: args.type },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.CreateOrganizationAction = CreateOrganizationAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new CreateOrganizationAction());
//# sourceMappingURL=CreateOrganizationAction.js.map