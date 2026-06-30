"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelegationManager = void 0;
const uuid_1 = require("uuid");
const SHARED_MISSIONS_COL = (organizationId) => `organizations/${organizationId}/sharedMissions`;
const SHARED_TASKS_COL = (organizationId) => `organizations/${organizationId}/sharedTasks`;
/**
 * The ONLY path by which the organization module touches Mission Control or
 * the Approval Engine. Mirrors MissionApprovalBridge.ts's no-bypass pattern
 * exactly: this class never executes anything itself, never decides risk,
 * never marks a shared task "completed" on its own authority. It only:
 *   (a) calls the real MissionEngine to create/read missions, then records a
 *       thin sharedMissions pointer doc linking that mission to a workspace
 *       and assigned members,
 *   (b) calls the real ApprovalEngine.createApprovalRequest for shared
 *       approval requests, and links the resulting ApprovalRequest id onto
 *       the sharedTask record so its status can be queried later.
 * Completion/approval state always lives in MissionEngine/ApprovalEngine —
 * this bridge only mirrors pointers and metadata into the org-scoped
 * collections so the organization UI can list/filter by workspace.
 */
class DelegationManager {
    constructor(db, missionEngine, approvalEngine) {
        this.db = db;
        this.missionEngine = missionEngine;
        this.approvalEngine = approvalEngine;
    }
    // ── Mission assignment ──────────────────────────────────────────────────
    async assignMissionToWorkspace(organizationId, actorUserId, workspaceId, underlyingMissionId, assignedMemberIds) {
        // Read-through the real mission, never duplicate its fields/state.
        const mission = await this.missionEngine.getMission(actorUserId, underlyingMissionId);
        if (!mission) {
            throw new Error(`Cannot assign mission ${underlyingMissionId}: not found for user ${actorUserId}`);
        }
        const sharedMissionId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
            id: sharedMissionId,
            organizationId,
            missionId: sharedMissionId,
            workspaceId,
            underlyingMissionId,
            assignedMemberIds,
            status: mission.status,
            createdBy: actorUserId,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(SHARED_MISSIONS_COL(organizationId)).doc(sharedMissionId).set(record);
        return record;
    }
    async listSharedMissions(organizationId, workspaceId) {
        let query = this.db.collection(SHARED_MISSIONS_COL(organizationId)).orderBy('createdAt', 'desc');
        if (workspaceId) {
            query = this.db.collection(SHARED_MISSIONS_COL(organizationId)).where('workspaceId', '==', workspaceId);
        }
        const snap = await query.get();
        return snap.docs.map((d) => d.data());
    }
    async countCompletedMissions(organizationId) {
        const snap = await this.db
            .collection(SHARED_MISSIONS_COL(organizationId))
            .where('status', '==', 'completed')
            .count()
            .get();
        return snap.data().count;
    }
    // ── Task delegation ──────────────────────────────────────────────────────
    async delegateTask(organizationId, actorUserId, workspaceId, input) {
        const taskId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
            id: taskId,
            organizationId,
            taskId,
            workspaceId,
            title: input.title.trim(),
            description: input.description?.trim() ?? '',
            assignedTo: input.assignedTo ?? null,
            delegatedBy: actorUserId,
            status: 'open',
            approvalRequestId: null,
            createdBy: actorUserId,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(SHARED_TASKS_COL(organizationId)).doc(taskId).set(record);
        return record;
    }
    async listSharedTasks(organizationId, workspaceId) {
        let query = this.db.collection(SHARED_TASKS_COL(organizationId)).orderBy('createdAt', 'desc');
        if (workspaceId) {
            query = this.db.collection(SHARED_TASKS_COL(organizationId)).where('workspaceId', '==', workspaceId);
        }
        const snap = await query.get();
        return snap.docs.map((d) => d.data());
    }
    async setTaskStatus(organizationId, taskId, status) {
        const ref = this.db.collection(SHARED_TASKS_COL(organizationId)).doc(taskId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ status, updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
    // ── Shared approvals — the no-bypass path ────────────────────────────────
    /**
     * Requests approval for a shared task via the REAL ApprovalEngine. This
     * method never executes the underlying action and never marks the task
     * completed — it only creates the ApprovalRequest and links its id onto
     * the SharedTaskRecord so callers can later poll getSharedTaskApprovalStatus.
     */
    async requestApprovalForTask(organizationId, actorUserId, taskId, input) {
        const taskRef = this.db.collection(SHARED_TASKS_COL(organizationId)).doc(taskId);
        const taskSnap = await taskRef.get();
        if (!taskSnap.exists)
            throw new Error(`Shared task ${taskId} not found in organization ${organizationId}`);
        const request = await this.approvalEngine.createApprovalRequest(actorUserId, {
            ...input,
            createdBy: actorUserId,
        });
        await taskRef.update({
            approvalRequestId: request.id,
            status: request.status === 'pending' ? 'blocked' : 'open',
            updatedAt: new Date().toISOString(),
        });
        return request;
    }
    async getSharedTaskApprovalStatus(organizationId, actorUserId, taskId) {
        const taskSnap = await this.db.collection(SHARED_TASKS_COL(organizationId)).doc(taskId).get();
        if (!taskSnap.exists)
            return null;
        const task = taskSnap.data();
        if (!task.approvalRequestId)
            return null;
        return this.approvalEngine.getApprovalRequest(actorUserId, task.approvalRequestId);
    }
    async countPendingApprovalsForOrg(organizationId, actorUserId) {
        const tasksSnap = await this.db
            .collection(SHARED_TASKS_COL(organizationId))
            .where('status', '==', 'blocked')
            .get();
        let pending = 0;
        for (const doc of tasksSnap.docs) {
            const task = doc.data();
            if (!task.approvalRequestId)
                continue;
            const req = await this.approvalEngine.getApprovalRequest(actorUserId, task.approvalRequestId);
            if (req && req.status === 'pending')
                pending += 1;
        }
        return pending;
    }
}
exports.DelegationManager = DelegationManager;
//# sourceMappingURL=DelegationManager.js.map