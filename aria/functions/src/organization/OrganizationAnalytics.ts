import type { MemberManager } from './MemberManager'
import type { WorkspaceManager } from './WorkspaceManager'
import type { ActivityFeed } from './ActivityFeed'
import type { DelegationManager } from './DelegationManager'
import type { OrganizationAnalyticsSnapshot } from './WorkspaceTypes'

/** Read-only aggregation across the other repositories — never writes. */
export class OrganizationAnalytics {
  constructor(
    private readonly members: MemberManager,
    private readonly workspaces: WorkspaceManager,
    private readonly activity: ActivityFeed,
    private readonly delegation: DelegationManager
  ) {}

  async getSnapshot(organizationId: string, actorUserId: string): Promise<OrganizationAnalyticsSnapshot> {
    const [memberCount, workspaceCount, sharedMissions, pendingApprovalCount, completedMissionCount, activityVolume] =
      await Promise.all([
        this.members.count(organizationId),
        this.workspaces.count(organizationId),
        this.delegation.listSharedMissions(organizationId),
        this.delegation.countPendingApprovalsForOrg(organizationId, actorUserId),
        this.delegation.countCompletedMissions(organizationId),
        this.activity.count(organizationId),
      ])

    return {
      organizationId,
      memberCount,
      workspaceCount,
      sharedMissionCount: sharedMissions.length,
      pendingApprovalCount,
      completedMissionCount,
      activityVolume,
      computedAt: new Date().toISOString(),
    }
  }
}
