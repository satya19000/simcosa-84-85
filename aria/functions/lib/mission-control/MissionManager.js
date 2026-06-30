"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionManager = void 0;
const uuid_1 = require("uuid");
const MissionEvents_1 = require("./MissionEvents");
/** Firestore repository for Missions. Never executes risky actions — pure CRUD + progress bookkeeping. */
class MissionManager {
    constructor(db) {
        this.db = db;
    }
    col(userId) {
        return this.db.collection('users').doc(userId).collection('missions');
    }
    async createMission(userId, fields) {
        const now = new Date().toISOString();
        const mission = {
            ...fields,
            id: (0, uuid_1.v4)(),
            userId,
            status: 'draft',
            progress: 0,
            createdAt: now,
            updatedAt: now,
        };
        await this.col(userId).doc(mission.id).set(mission);
        void MissionEvents_1.MissionEvents.emit('mission:created', userId, { missionId: mission.id });
        return mission;
    }
    async getMission(userId, missionId) {
        const doc = await this.col(userId).doc(missionId).get();
        return doc.exists ? doc.data() : null;
    }
    async listMissions(userId, opts = {}) {
        let query = this.col(userId);
        if (opts.status)
            query = query.where('status', '==', opts.status);
        if (opts.domain)
            query = query.where('domain', '==', opts.domain);
        if (opts.priority)
            query = query.where('priority', '==', opts.priority);
        const snap = await query.orderBy('createdAt', 'desc').limit(200).get();
        return snap.docs.map((d) => d.data());
    }
    async updateMission(userId, missionId, fields) {
        const ref = this.col(userId).doc(missionId);
        const doc = await ref.get();
        if (!doc.exists)
            return null;
        const updatedAt = new Date().toISOString();
        await ref.update({ ...fields, updatedAt });
        const updated = { ...doc.data(), ...fields, updatedAt };
        void MissionEvents_1.MissionEvents.emit('mission:updated', userId, { missionId });
        return updated;
    }
    async setProgress(userId, missionId, progress) {
        const ref = this.col(userId).doc(missionId);
        const doc = await ref.get();
        if (!doc.exists)
            return null;
        const updatedAt = new Date().toISOString();
        const clamped = Math.max(0, Math.min(100, progress));
        const patch = { progress: clamped, updatedAt };
        if (clamped >= 100) {
            patch.status = 'completed';
            patch.completedAt = updatedAt;
        }
        await ref.update(patch);
        const updated = { ...doc.data(), ...patch };
        if (clamped >= 100)
            void MissionEvents_1.MissionEvents.emit('mission:completed', userId, { missionId });
        return updated;
    }
    async setMemoryNodeId(userId, missionId, memoryNodeId) {
        await this.col(userId).doc(missionId).update({ memoryNodeId });
    }
    async abandonMission(userId, missionId, reason) {
        const ref = this.col(userId).doc(missionId);
        const doc = await ref.get();
        if (!doc.exists)
            return null;
        const updatedAt = new Date().toISOString();
        await ref.update({ status: 'abandoned', updatedAt });
        void MissionEvents_1.MissionEvents.emit('mission:abandoned', userId, { missionId, reason });
        return { ...doc.data(), status: 'abandoned', updatedAt };
    }
    async deleteMission(userId, missionId) {
        await this.col(userId).doc(missionId).delete();
    }
}
exports.MissionManager = MissionManager;
//# sourceMappingURL=MissionManager.js.map