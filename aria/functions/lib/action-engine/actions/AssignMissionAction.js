"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignMissionAction = void 0;
const ActionContext_1 = require("../ActionContext");
const ActionResult_1 = require("../ActionResult");
const Validation_1 = require("../Validation");
const Errors_1 = require("../Errors");
const organization_1 = require("../../organization");
/**
 * Wraps OrganizationEngine.assignMissionToWorkspace, which itself only calls
 * the real MissionEngine.getMission to read the mission and never duplicates
 * or executes mission logic — see DelegationManager.ts's documented bridge
 * pattern, mirroring MissionApprovalBridge.
 */
class AssignMissionAction {
    constructor() {
        this.toolName = 'assignMission';
    }
    validate(args) {
        (0, Validation_1.requireString)(args.organizationId, 'organizationId');
        (0, Validation_1.requireString)(args.workspaceId, 'workspaceId');
        (0, Validation_1.requireString)(args.missionId, 'missionId');
        if (!Array.isArray(args.assignedMemberIds) || args.assignedMemberIds.length === 0) {
            throw new Errors_1.ValidationError('assignedMemberIds', 'must be a non-empty array');
        }
    }
    async execute(args, ctx) {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
            const engine = (0, organization_1.getOrganizationEngine)(ctx.userId, ctx.db, apiKey);
            const record = await engine.assignMissionToWorkspace(ctx.userId, args.organizationId, args.workspaceId, args.missionId, args.assignedMemberIds);
            const data = {
                sharedMissionId: record.missionId,
                workspaceId: record.workspaceId,
                underlyingMissionId: record.underlyingMissionId,
            };
            return (0, ActionResult_1.successResult)(record.missionId, `Mission assigned to workspace.`, data, (0, ActionContext_1.elapsedMs)(ctx));
        }
        catch (err) {
            throw new Errors_1.ExecutionError(this.toolName, err);
        }
    }
    async rollback() {
        // Best-effort no-op: shared mission pointer is non-destructive metadata; underlying
        // mission state in MissionEngine is never touched by this action, so nothing to undo there.
    }
    audit(args, ctx, result) {
        return {
            actionId: result.actionId,
            toolName: this.toolName,
            userId: ctx.userId,
            timestamp: ctx.requestTimestamp,
            durationMs: result.executionTimeMs,
            success: result.success,
            argsSummary: { organizationId: args.organizationId, workspaceId: args.workspaceId, missionId: args.missionId, memberCount: args.assignedMemberIds?.length ?? 0 },
            errorCode: result.error?.code ?? null,
            errorDetail: result.error?.detail ?? null,
        };
    }
}
exports.AssignMissionAction = AssignMissionAction;
const ActionRegistry_1 = require("../ActionRegistry");
ActionRegistry_1.registry.register(new AssignMissionAction());
//# sourceMappingURL=AssignMissionAction.js.map