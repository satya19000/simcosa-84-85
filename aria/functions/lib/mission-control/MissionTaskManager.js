"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionTaskManager = void 0;
const uuid_1 = require("uuid");
const MissionEvents_1 = require("./MissionEvents");
/** Firestore repository for MissionTasks, scoped under each mission. */
class MissionTaskManager {
    constructor(db) {
        this.db = db;
    }
    col(userId) {
        return this.db.collection('users').doc(userId).collection('missionTasks');
    }
    async createTask(userId, fields) {
        const now = new Date().toISOString();
        const task = {
            ...fields,
            id: (0, uuid_1.v4)(),
            userId,
            status: 'pending',
            createdAt: now,
            updatedAt: now,
        };
        await this.col(userId).doc(task.id).set(task);
        void MissionEvents_1.MissionEvents.emit('task:created', userId, { taskId: task.id, missionId: task.missionId });
        return task;
    }
    async getTask(userId, taskId) {
        const doc = await this.col(userId).doc(taskId).get();
        return doc.exists ? doc.data() : null;
    }
    async listTasksForMission(userId, missionId) {
        const snap = await this.col(userId).where('missionId', '==', missionId).orderBy('order', 'asc').get();
        return snap.docs.map((d) => d.data());
    }
    async listAllTasks(userId, opts = {}) {
        let query = this.col(userId);
        if (opts.status)
            query = query.where('status', '==', opts.status);
        const snap = await query.orderBy('createdAt', 'desc').limit(200).get();
        return snap.docs.map((d) => d.data());
    }
    async setStatus(userId, taskId, status) {
        const ref = this.col(userId).doc(taskId);
        const doc = await ref.get();
        if (!doc.exists)
            return null;
        const updatedAt = new Date().toISOString();
        const patch = { status, updatedAt };
        if (status === 'completed')
            patch.completedAt = updatedAt;
        await ref.update(patch);
        const updated = { ...doc.data(), ...patch };
        if (status === 'completed')
            void MissionEvents_1.MissionEvents.emit('task:completed', userId, { taskId, missionId: updated.missionId });
        if (status === 'blocked')
            void MissionEvents_1.MissionEvents.emit('task:blocked', userId, { taskId, missionId: updated.missionId });
        return updated;
    }
    async linkApprovalRequest(userId, taskId, approvalRequestId) {
        await this.col(userId).doc(taskId).update({ approvalRequestId, updatedAt: new Date().toISOString() });
    }
    /** Are this task's declared dependencies all completed? Used to gate execution. */
    async dependenciesSatisfied(userId, task) {
        if (task.dependsOn.length === 0)
            return true;
        const deps = await Promise.all(task.dependsOn.map((id) => this.getTask(userId, id)));
        return deps.every((d) => d?.status === 'completed');
    }
    async deleteTask(userId, taskId) {
        await this.col(userId).doc(taskId).delete();
    }
    async deleteTasksForMission(userId, missionId) {
        const tasks = await this.listTasksForMission(userId, missionId);
        await Promise.all(tasks.map((t) => this.deleteTask(userId, t.id)));
    }
}
exports.MissionTaskManager = MissionTaskManager;
//# sourceMappingURL=MissionTaskManager.js.map