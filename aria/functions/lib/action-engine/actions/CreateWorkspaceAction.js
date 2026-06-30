"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWorkspaceAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const organization_1 = require("../../organization");
class CreateWorkspaceAction {
    constructor() {
        this.toolName = 'createWorkspace';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.organizationId, 'organizationId');
        (0, Validation_1.requireStringMax)(args.name, 'name', 200);
        (0, Validation_1.optionalString)(args.description, 'description');
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, organization_1.getOrganizationEngine)(ctx.userId, ctx.db, apiKey);
            const workspace = await engine.createWorkspace(ctx.userId, args.organizationId, {
                name: args.name,
                description: args.description,
            });
            const data = { organizationId: args.organizationId, workspaceId: workspace.workspaceId, name: workspace.name };
            return (0, ActionResult_1.successResult)(workspace.workspaceId, `Workspace "${workspace.name}" created.`, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback() {
        // Best-effort no-op — see CreateOrganizationAction for rationale.
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { organizationId: args.organizationId, name: args.name },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.CreateWorkspaceAction = CreateWorkspaceAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new CreateWorkspaceAction());
//# sourceMappingURL=CreateWorkspaceAction.js.map