"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelegateTaskAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const organization_1 = require("../../organization");
class DelegateTaskAction {
    constructor() {
        this.toolName = 'delegateTask';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.organizationId, 'organizationId');
        (0, Validation_1.requireString)(args.workspaceId, 'workspaceId');
        (0, Validation_1.requireStringMax)(args.title, 'title', 200);
        (0, Validation_1.optionalString)(args.description, 'description');
        (0, Validation_1.optionalString)(args.assignedTo, 'assignedTo');
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, organization_1.getOrganizationEngine)(ctx.userId, ctx.db, apiKey);
            const task = await engine.delegateTask(ctx.userId, args.organizationId, args.workspaceId, {
                title: args.title,
                description: args.description,
                assignedTo: args.assignedTo ?? null,
            });
            const data = { taskId: task.taskId, workspaceId: task.workspaceId, title: task.title };
            return (0, ActionResult_1.successResult)(task.taskId, `Task "${task.title}" delegated.`, data, (0, ActionContext_1.elapsedMs)(ctx));
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
            argsSummary: { organizationId: args.organizationId, workspaceId: args.workspaceId, title: args.title, assignedTo: args.assignedTo ?? null },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.DelegateTaskAction = DelegateTaskAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new DelegateTaskAction());
//# sourceMappingURL=DelegateTaskAction.js.map