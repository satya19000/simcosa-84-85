"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostAnnouncementAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const organization_1 = require("../../organization");
class PostAnnouncementAction {
    constructor() {
        this.toolName = 'postAnnouncement';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.organizationId, 'organizationId');
        (0, Validation_1.requireStringMax)(args.title, 'title', 200);
        (0, Validation_1.requireString)(args.body, 'body');
        (0, Validation_1.optionalString)(args.workspaceId, 'workspaceId');
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, organization_1.getOrganizationEngine)(ctx.userId, ctx.db, apiKey);
            const record = await engine.postAnnouncement(ctx.userId, args.organizationId, {
                title: args.title,
                body: args.body,
                workspaceId: args.workspaceId ?? null,
            });
            const data = { activityId: record.activityId, title: args.title };
            return (0, ActionResult_1.successResult)(record.activityId, `Announcement "${args.title}" posted.`, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback() {
        // Best-effort no-op: announcements are append-only activity feed entries, treated as
        // immutable history, mirroring ApprovalHistory's append-only philosophy.
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { organizationId: args.organizationId, title: args.title, workspaceId: args.workspaceId ?? null },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.PostAnnouncementAction = PostAnnouncementAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new PostAnnouncementAction());
//# sourceMappingURL=PostAnnouncementAction.js.map