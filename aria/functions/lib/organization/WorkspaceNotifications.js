"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceNotifications = void 0;
const uuid_1 = require("uuid");
const COL = (userId) => `users/${userId}/notifications`;
/**
 * In-app notification records only — mirrors ApprovalNotifications.ts.
 * Never sends external email/push itself; that integration point belongs
 * to the existing notifications.ts Cloud Function module if/when wired.
 */
class WorkspaceNotifications {
    constructor(db) {
        this.db = db;
    }
    async write(userId, payload) {
        const id = (0, uuid_1.v4)();
        await this.db
            .collection(COL(userId))
            .doc(id)
            .set({ id, ...payload, createdAt: new Date().toISOString(), read: false });
    }
    async notifyInvited(email, invitedUserId, organizationName) {
        if (!invitedUserId)
            return; // user not yet registered — invitation email/link is out of scope here
        await this.write(invitedUserId, {
            type: 'organization_invitation',
            title: `You've been invited to join ${organizationName}`,
            body: `An invitation was sent to ${email}.`,
        });
    }
    async notifyMemberJoined(notifyUserIds, organizationName, joinedDisplayName) {
        for (const userId of notifyUserIds) {
            await this.write(userId, {
                type: 'organization_member_joined',
                title: `${joinedDisplayName} joined ${organizationName}`,
                body: `${joinedDisplayName} accepted their invitation.`,
            });
        }
    }
    async notifyMissionAssigned(assignedUserIds, missionTitle, workspaceName) {
        for (const userId of assignedUserIds) {
            await this.write(userId, {
                type: 'mission_assigned',
                title: `Mission assigned: ${missionTitle}`,
                body: `You were assigned a mission in workspace "${workspaceName}".`,
            });
        }
    }
    async notifyTaskDelegated(assignedUserId, taskTitle) {
        if (!assignedUserId)
            return;
        await this.write(assignedUserId, {
            type: 'task_delegated',
            title: `Task delegated: ${taskTitle}`,
            body: `A task was delegated to you.`,
        });
    }
    async notifyAnnouncement(notifyUserIds, title) {
        for (const userId of notifyUserIds) {
            await this.write(userId, {
                type: 'announcement_posted',
                title: `Announcement: ${title}`,
                body: title,
            });
        }
    }
}
exports.WorkspaceNotifications = WorkspaceNotifications;
//# sourceMappingURL=WorkspaceNotifications.js.map