"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateGroupAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const security_1 = require("../../security");
/** Thin wrapper around SecurityEngine.createGroup — no raw Firestore writes here. */
class CreateGroupAction {
    constructor() {
        this.toolName = 'createGroup';
    }
    validate(args) {
        (0, Validation_1.requireStringMax)(args.tenantId, 'tenantId', 200);
        (0, Validation_1.requireStringMax)(args.name, 'name', 200);
        (0, Validation_1.optionalString)(args.description, 'description');
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, security_1.getSecurityEngine)(ctx.userId, ctx.db, apiKey);
            const group = await engine.createGroup(ctx.userId, args.tenantId, { name: args.name, description: args.description });
            const data = { groupId: group.groupId, name: group.name };
            return (0, ActionResult_1.successResult)(group.groupId, `Group "${group.name}" created.`, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback() {
        // Group creation has no automatic safe rollback; best-effort no-op.
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { tenantId: args.tenantId, name: args.name },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.CreateGroupAction = CreateGroupAction;
// Self-register on module load
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new CreateGroupAction());
//# sourceMappingURL=CreateGroupAction.js.map