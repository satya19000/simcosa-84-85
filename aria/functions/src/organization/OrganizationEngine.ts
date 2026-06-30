import type * as admin from 'firebase-admin'
import { OrganizationManager } from './OrganizationManager'
import { WorkspaceManager } from './WorkspaceManager'
import { MemberManager } from './MemberManager'
import { InvitationManager } from './InvitationManager'
import { ActivityFeed } from './ActivityFeed'
import { DelegationManager } from './DelegationManager'
import { OrganizationAnalytics } from './OrganizationAnalytics'
import { WorkspacePermissions } from './WorkspacePermissions'
import { WorkspacePolicies } from './WorkspacePolicies'
import { WorkspaceNotifications } from './WorkspaceNotifications'
import { WorkspaceLogger } from './WorkspaceLogger'
import { getMemoryGraph } from '../memory-graph'
import type { MissionEngine } from '../mission-control/MissionEngine'
import type { ApprovalEngine, CreateApprovalRequestInput } from '../delegation/ApprovalEngine'
import type { ApprovalRequest } from '../delegation/ApprovalTypes'
import type { WorkspaceConfig } from './WorkspaceConfig'
import type {
  OrganizationRecord, OrganizationType, WorkspaceRecord, MemberRecord, MemberRole,
  InvitationRecord, ActivityRecord, SharedMissionRecord, SharedTaskRecord,
  OrganizationAnalyticsSnapshot,
} from './WorkspaceTypes'

/**
 * Facade orchestrating the entire Organization / Multi-User Workspace
 * platform. Mirrors ApprovalEngine's/MissionEngine's constructor signature
 * and composition style — this class never duplicates Mission Control or
 * Approval Engine logic, it only composes the Manager/repository classes
 * below it and calls into the real engines via DelegationManager.
 *
 * HARD INVARIANT (the organization-module equivalent of "no approval
 * bypass"): every method that reads or writes anything under
 * organizations/{organizationId}/** first calls
 * this.permissions.requireMember (or requireRole/requireWriter) for the
 * calling userId against that exact organizationId. No method may skip
 * this check. There is no cross-organization access path in this class.
 */
export class OrganizationEngine {
  private readonly organizations: OrganizationManager
  private readonly workspaces: WorkspaceManager
  private readonly members: MemberManager
  private readonly invitations: InvitationManager
  private readonly activity: ActivityFeed
  private readonly delegation: DelegationManager
  private readonly analytics: OrganizationAnalytics
  private readonly permissions: WorkspacePermissions
  private readonly policies: WorkspacePolicies
  private readonly notifications: WorkspaceNotifications
  private readonly logger: WorkspaceLogger

  constructor(
    private readonly db: admin.firestore.Firestore,
    config: WorkspaceConfig,
    private readonly apiKey: string,
    missionEngine: MissionEngine,
    approvalEngine: ApprovalEngine
  ) {
    this.organizations = new OrganizationManager(db)
    this.workspaces = new WorkspaceManager(db)
    this.members = new MemberManager(db)
    this.invitations = new InvitationManager(db)
    this.activity = new ActivityFeed(db)
    this.delegation = new DelegationManager(db, missionEngine, approvalEngine)
    this.permissions = new WorkspacePermissions(db)
    this.policies = new WorkspacePolicies(config)
    this.notifications = new WorkspaceNotifications(db)
    this.logger = new WorkspaceLogger()
    this.analytics = new OrganizationAnalytics(this.members, this.workspaces, this.activity, this.delegation)
  }

  // ── Organization lifecycle ───────────────────────────────────────────────

  async createOrganization(
    userId: string,
    input: { name: string; type: OrganizationType; description?: string }
  ): Promise<OrganizationRecord> {
    const org = await this.organizations.create(userId, input)
    // Creator becomes the first member, role 'owner'.
    await this.members.addMember(org.organizationId, userId, {
      userId,
      displayName: userId,
      email: '',
      role: 'owner',
    })
    await this.activity.record(org.organizationId, userId, 'organization_created', `Organization "${org.name}" created`, {
      metadata: { type: org.type },
    })
    void this.linkOrganizationToMemory(userId, org)
    this.logger.info(org.organizationId, 'organization_created', { userId })
    return org
  }

  async getOrganization(userId: string, organizationId: string): Promise<OrganizationRecord | null> {
    await this.permissions.requireMember(organizationId, userId)
    return this.organizations.get(organizationId)
  }

  async updateOrganization(
    userId: string,
    organizationId: string,
    fields: Partial<Pick<OrganizationRecord, 'name' | 'description' | 'type'>>
  ): Promise<OrganizationRecord | null> {
    await this.permissions.requireRole(organizationId, userId, 'admin')
    const updated = await this.organizations.update(organizationId, fields)
    if (updated) this.logger.info(organizationId, 'organization_updated', { userId, fields })
    return updated
  }

  async listMyOrganizations(userId: string, candidateOrganizationIds: string[]): Promise<OrganizationRecord[]> {
    // Caller supplies the candidate ids (e.g. from a denormalized user profile doc);
    // we still verify membership for each before returning anything.
    const memberOf: string[] = []
    for (const organizationId of candidateOrganizationIds) {
      if (await this.permissions.isMember(organizationId, userId)) memberOf.push(organizationId)
    }
    return this.organizations.listForUser(memberOf)
  }

  // ── Workspaces ────────────────────────────────────────────────────────────

  async createWorkspace(
    userId: string,
    organizationId: string,
    input: { name: string; description?: string }
  ): Promise<WorkspaceRecord> {
    const member = await this.permissions.requireRole(organizationId, userId, 'manager')
    const currentCount = await this.workspaces.count(organizationId)
    if (!this.policies.canCreateMoreWorkspaces(currentCount)) {
      throw new Error(`Organization ${organizationId} has reached its workspace limit`)
    }
    const workspace = await this.workspaces.create(organizationId, userId, input)
    await this.members.addWorkspace(organizationId, member.memberId, workspace.workspaceId)
    await this.activity.record(organizationId, userId, 'workspace_created', `Workspace "${workspace.name}" created`, {
      workspaceId: workspace.workspaceId,
    })
    this.logger.info(organizationId, 'workspace_created', { userId, workspaceId: workspace.workspaceId })
    return workspace
  }

  async getWorkspace(userId: string, organizationId: string, workspaceId: string): Promise<WorkspaceRecord | null> {
    await this.permissions.requireMember(organizationId, userId)
    return this.workspaces.get(organizationId, workspaceId)
  }

  async listWorkspaces(userId: string, organizationId: string): Promise<WorkspaceRecord[]> {
    await this.permissions.requireMember(organizationId, userId)
    return this.workspaces.list(organizationId)
  }

  // ── Members ───────────────────────────────────────────────────────────────

  async listMembers(userId: string, organizationId: string): Promise<MemberRecord[]> {
    await this.permissions.requireMember(organizationId, userId)
    return this.members.list(organizationId)
  }

  async removeMember(userId: string, organizationId: string, memberId: string): Promise<MemberRecord | null> {
    await this.permissions.requireRole(organizationId, userId, 'admin')
    const removed = await this.members.remove(organizationId, memberId)
    if (removed) {
      await this.activity.record(organizationId, userId, 'member_removed', `Member ${removed.displayName} removed`, {
        targetId: memberId,
      })
      this.logger.info(organizationId, 'member_removed', { userId, memberId })
    }
    return removed
  }

  async changeMemberRole(userId: string, organizationId: string, memberId: string, role: MemberRole): Promise<MemberRecord | null> {
    await this.permissions.requireRole(organizationId, userId, 'admin')
    const updated = await this.members.updateRole(organizationId, memberId, role)
    if (updated) {
      await this.activity.record(organizationId, userId, 'member_role_changed', `${updated.displayName}'s role changed to ${role}`, {
        targetId: memberId,
        metadata: { role },
      })
    }
    return updated
  }

  // ── Invitations ───────────────────────────────────────────────────────────

  async inviteMember(
    userId: string,
    organizationId: string,
    input: { email: string; role: MemberRole; workspaceId?: string | null }
  ): Promise<InvitationRecord> {
    const member = await this.permissions.requireRole(organizationId, userId, 'manager')
    if (input.role === 'owner' && member.role !== 'owner') {
      throw new Error('Only an owner can invite a new owner')
    }
    const org = await this.organizations.get(organizationId)
    if (!org) throw new Error(`Organization ${organizationId} not found`)

    const currentCount = await this.members.count(organizationId)
    if (!this.policies.canInviteMore(currentCount)) {
      throw new Error(`Organization ${organizationId} has reached its member limit`)
    }

    const invitation = await this.invitations.create(organizationId, userId, {
      email: input.email,
      role: input.role,
      workspaceId: input.workspaceId ?? null,
      expiresAt: this.policies.invitationExpiresAt(),
    })

    await this.activity.record(organizationId, userId, 'member_invited', `Invited ${input.email} as ${input.role}`, {
      workspaceId: input.workspaceId ?? null,
      targetId: invitation.invitationId,
    })
    void this.notifications.notifyInvited(input.email, null, org.name)
    this.logger.info(organizationId, 'member_invited', { userId, email: input.email })
    return invitation
  }

  async listInvitations(userId: string, organizationId: string): Promise<InvitationRecord[]> {
    await this.permissions.requireRole(organizationId, userId, 'manager')
    return this.invitations.list(organizationId)
  }

  async acceptInvitation(
    userId: string,
    organizationId: string,
    invitationId: string,
    profile: { displayName: string; email: string }
  ): Promise<MemberRecord> {
    // No membership check here by design: a person accepting an invitation is
    // not yet a member. We instead verify the invitation itself is valid.
    const invitation = await this.invitations.get(organizationId, invitationId)
    if (!invitation) throw new Error(`Invitation ${invitationId} not found`)
    if (invitation.status !== 'pending') throw new Error(`Invitation ${invitationId} is ${invitation.status}, not pending`)
    if (this.policies.isInvitationExpired(invitation.expiresAt)) {
      await this.invitations.markExpired(organizationId, invitationId)
      throw new Error(`Invitation ${invitationId} has expired`)
    }

    const existing = await this.members.getByUserId(organizationId, userId)
    if (existing) throw new Error(`User ${userId} is already a member of organization ${organizationId}`)

    const member = await this.members.addMember(organizationId, userId, {
      userId,
      displayName: profile.displayName,
      email: profile.email,
      role: invitation.role,
      workspaceIds: invitation.workspaceId ? [invitation.workspaceId] : [],
    })
    await this.invitations.markAccepted(organizationId, invitationId, userId)

    const org = await this.organizations.get(organizationId)
    const allMembers = await this.members.list(organizationId)
    const notifyIds = allMembers.filter((m) => m.userId !== userId).map((m) => m.userId)
    void this.notifications.notifyMemberJoined(notifyIds, org?.name ?? organizationId, profile.displayName)

    await this.activity.record(organizationId, userId, 'member_joined', `${profile.displayName} joined the organization`, {
      targetId: member.memberId,
    })
    this.logger.info(organizationId, 'member_joined', { userId })
    return member
  }

  async revokeInvitation(userId: string, organizationId: string, invitationId: string): Promise<InvitationRecord | null> {
    await this.permissions.requireRole(organizationId, userId, 'manager')
    return this.invitations.revoke(organizationId, invitationId)
  }

  // ── Activity feed ─────────────────────────────────────────────────────────

  async listActivity(userId: string, organizationId: string, workspaceId?: string): Promise<ActivityRecord[]> {
    await this.permissions.requireMember(organizationId, userId)
    return workspaceId ? this.activity.listForWorkspace(organizationId, workspaceId) : this.activity.list(organizationId)
  }

  async postAnnouncement(
    userId: string,
    organizationId: string,
    input: { title: string; body: string; workspaceId?: string | null }
  ): Promise<ActivityRecord> {
    const member = await this.permissions.requireWriter(organizationId, userId)
    if (!this.policies.canManageOrganization(member) && !(input.workspaceId && this.policies.canManageWorkspace(member, input.workspaceId))) {
      throw new Error('Only organization admins/owners or workspace managers can post announcements')
    }
    const record = await this.activity.record(organizationId, userId, 'announcement_posted', input.title, {
      workspaceId: input.workspaceId ?? null,
      metadata: { body: input.body },
    })
    const allMembers = await this.members.list(organizationId)
    const notifyIds = allMembers.filter((m) => m.userId !== userId).map((m) => m.userId)
    void this.notifications.notifyAnnouncement(notifyIds, input.title)
    return record
  }

  // ── Mission Control integration (via DelegationManager bridge only) ───────

  async assignMissionToWorkspace(
    userId: string,
    organizationId: string,
    workspaceId: string,
    underlyingMissionId: string,
    assignedMemberIds: string[]
  ): Promise<SharedMissionRecord> {
    const member = await this.permissions.requireRole(organizationId, userId, 'manager')
    if (!this.policies.canManageWorkspace(member, workspaceId)) {
      throw new Error(`User ${userId} cannot manage workspace ${workspaceId}`)
    }
    const record = await this.delegation.assignMissionToWorkspace(organizationId, userId, workspaceId, underlyingMissionId, assignedMemberIds)
    const workspace = await this.workspaces.get(organizationId, workspaceId)
    await this.activity.record(organizationId, userId, 'mission_assigned', `Mission assigned to workspace "${workspace?.name ?? workspaceId}"`, {
      workspaceId,
      targetId: record.missionId,
    })
    void this.notifications.notifyMissionAssigned(assignedMemberIds, record.underlyingMissionId, workspace?.name ?? workspaceId)
    return record
  }

  async listSharedMissions(userId: string, organizationId: string, workspaceId?: string): Promise<SharedMissionRecord[]> {
    await this.permissions.requireMember(organizationId, userId)
    return this.delegation.listSharedMissions(organizationId, workspaceId)
  }

  // ── Team delegation (shared tasks) ────────────────────────────────────────

  async delegateTask(
    userId: string,
    organizationId: string,
    workspaceId: string,
    input: { title: string; description?: string; assignedTo?: string | null }
  ): Promise<SharedTaskRecord> {
    const member = await this.permissions.requireWriter(organizationId, userId)
    if (!member.workspaceIds.includes(workspaceId) && !this.policies.canManageOrganization(member)) {
      throw new Error(`User ${userId} is not part of workspace ${workspaceId}`)
    }
    const task = await this.delegation.delegateTask(organizationId, userId, workspaceId, input)
    await this.activity.record(organizationId, userId, 'task_delegated', `Task "${task.title}" delegated`, {
      workspaceId,
      targetId: task.taskId,
    })
    void this.notifications.notifyTaskDelegated(input.assignedTo ?? null, task.title)
    return task
  }

  async listSharedTasks(userId: string, organizationId: string, workspaceId?: string): Promise<SharedTaskRecord[]> {
    await this.permissions.requireMember(organizationId, userId)
    return this.delegation.listSharedTasks(organizationId, workspaceId)
  }

  // ── Shared approvals (via DelegationManager -> real ApprovalEngine only) ──

  async requestApprovalForSharedTask(
    userId: string,
    organizationId: string,
    taskId: string,
    input: Omit<CreateApprovalRequestInput, 'createdBy'>
  ): Promise<ApprovalRequest> {
    await this.permissions.requireWriter(organizationId, userId)
    const request = await this.delegation.requestApprovalForTask(organizationId, userId, taskId, input)
    await this.activity.record(organizationId, userId, 'approval_requested', `Approval requested: ${input.title}`, {
      targetId: taskId,
      metadata: { approvalRequestId: request.id },
    })
    return request
  }

  async getSharedTaskApprovalStatus(userId: string, organizationId: string, taskId: string): Promise<ApprovalRequest | null> {
    await this.permissions.requireMember(organizationId, userId)
    return this.delegation.getSharedTaskApprovalStatus(organizationId, userId, taskId)
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  async getAnalytics(userId: string, organizationId: string): Promise<OrganizationAnalyticsSnapshot> {
    await this.permissions.requireMember(organizationId, userId)
    return this.analytics.getSnapshot(organizationId, userId)
  }

  // ── Permissions passthrough (read-only checks for callers) ───────────────

  get permissionsApi(): WorkspacePermissions {
    return this.permissions
  }

  // ── Memory Graph Integration (best-effort, identical pattern to ApprovalEngine) ──

  private async linkOrganizationToMemory(userId: string, org: OrganizationRecord): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      await graph.upsertNode(
        'organization',
        org.name,
        `${org.type} organization created`,
        { organizationId: org.organizationId },
        25
      )
    } catch {
      // best-effort
    }
  }
}
