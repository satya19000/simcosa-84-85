"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspacePolicies = void 0;
/**
 * Organization-level policy decisions that aren't pure role-ordering
 * (those belong in WorkspacePermissions). Mirrors ApprovalPolicy.ts's
 * "single source of truth for a band of business rules" role.
 */
class WorkspacePolicies {
    constructor(config) {
        this.config = config;
    }
    canInviteMore(currentMemberCount) {
        return currentMemberCount < this.config.maxMembersPerOrganization;
    }
    canCreateMoreWorkspaces(currentWorkspaceCount) {
        return currentWorkspaceCount < this.config.maxWorkspacesPerOrganization;
    }
    invitationExpiresAt(now = new Date()) {
        return new Date(now.getTime() + this.config.invitationExpiryMs).toISOString();
    }
    isInvitationExpired(expiresAt, now = new Date()) {
        return new Date(expiresAt).getTime() < now.getTime();
    }
    /** Only Owner/Admin may manage org-level settings; Manager may manage their own workspace. */
    canManageOrganization(member) {
        return member.role === 'owner' || member.role === 'admin';
    }
    canManageWorkspace(member, workspaceId) {
        if (this.canManageOrganization(member))
            return true;
        return member.role === 'manager' && member.workspaceIds.includes(workspaceId);
    }
}
exports.WorkspacePolicies = WorkspacePolicies;
//# sourceMappingURL=WorkspacePolicies.js.map