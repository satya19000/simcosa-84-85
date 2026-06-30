import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'

const COL = (userId: string) => `users/${userId}/notifications`

/**
 * In-app notification records only — mirrors ApprovalNotifications.ts.
 * Never sends external email/push itself; that integration point belongs
 * to the existing notifications.ts Cloud Function module if/when wired.
 */
export class WorkspaceNotifications {
  constructor(private readonly db: admin.firestore.Firestore) {}

  private async write(userId: string, payload: Record<string, unknown>): Promise<void> {
    const id = uuidv4()
    await this.db
      .collection(COL(userId))
      .doc(id)
      .set({ id, ...payload, createdAt: new Date().toISOString(), read: false })
  }

  async notifyInvited(email: string, invitedUserId: string | null, organizationName: string): Promise<void> {
    if (!invitedUserId) return // user not yet registered — invitation email/link is out of scope here
    await this.write(invitedUserId, {
      type: 'organization_invitation',
      title: `You've been invited to join ${organizationName}`,
      body: `An invitation was sent to ${email}.`,
    })
  }

  async notifyMemberJoined(notifyUserIds: string[], organizationName: string, joinedDisplayName: string): Promise<void> {
    for (const userId of notifyUserIds) {
      await this.write(userId, {
        type: 'organization_member_joined',
        title: `${joinedDisplayName} joined ${organizationName}`,
        body: `${joinedDisplayName} accepted their invitation.`,
      })
    }
  }

  async notifyMissionAssigned(assignedUserIds: string[], missionTitle: string, workspaceName: string): Promise<void> {
    for (const userId of assignedUserIds) {
      await this.write(userId, {
        type: 'mission_assigned',
        title: `Mission assigned: ${missionTitle}`,
        body: `You were assigned a mission in workspace "${workspaceName}".`,
      })
    }
  }

  async notifyTaskDelegated(assignedUserId: string | null, taskTitle: string): Promise<void> {
    if (!assignedUserId) return
    await this.write(assignedUserId, {
      type: 'task_delegated',
      title: `Task delegated: ${taskTitle}`,
      body: `A task was delegated to you.`,
    })
  }

  async notifyAnnouncement(notifyUserIds: string[], title: string): Promise<void> {
    for (const userId of notifyUserIds) {
      await this.write(userId, {
        type: 'announcement_posted',
        title: `Announcement: ${title}`,
        body: title,
      })
    }
  }
}
