"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationAnalytics = void 0;
/** Read-only aggregation across the other repositories — never writes. */
class OrganizationAnalytics {
    constructor(members, workspaces, activity, delegation) {
        this.members = members;
        this.workspaces = workspaces;
        this.activity = activity;
        this.delegation = delegation;
    }
    async getSnapshot(organizationId, actorUserId) {
        const [memberCount, workspaceCount, sharedMissions, pendingApprovalCount, completedMissionCount, activityVolume] = await Promise.all([
            this.members.count(organizationId),
            this.workspaces.count(organizationId),
            this.delegation.listSharedMissions(organizationId),
            this.delegation.countPendingApprovalsForOrg(organizationId, actorUserId),
            this.delegation.countCompletedMissions(organizationId),
            this.activity.count(organizationId),
        ]);
        return {
            organizationId,
            memberCount,
            workspaceCount,
            sharedMissionCount: sharedMissions.length,
            pendingApprovalCount,
            completedMissionCount,
            activityVolume,
            computedAt: new Date().toISOString(),
        };
    }
}
exports.OrganizationAnalytics = OrganizationAnalytics;
//# sourceMappingURL=OrganizationAnalytics.js.map