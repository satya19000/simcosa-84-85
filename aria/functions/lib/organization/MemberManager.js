"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberManager = void 0;
const uuid_1 = require("uuid");
const COL = (organizationId) => `organizations/${organizationId}/members`;
/** Repository for organizations/{organizationId}/members/{memberId}. Owns ALL raw Firestore access for this collection. */
class MemberManager {
    constructor(db) {
        this.db = db;
    }
    async addMember(organizationId, createdBy, input) {
        const memberId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
            id: memberId,
            organizationId,
            memberId,
            userId: input.userId,
            displayName: input.displayName,
            email: input.email,
            role: input.role,
            workspaceIds: input.workspaceIds ?? [],
            status: 'active',
            createdBy,
            createdAt: now,
            updatedAt: now,
            joinedAt: now,
        };
        await this.db.collection(COL(organizationId)).doc(memberId).set(record);
        return record;
    }
    async get(organizationId, memberId) {
        const snap = await this.db.collection(COL(organizationId)).doc(memberId).get();
        return snap.exists ? snap.data() : null;
    }
    async getByUserId(organizationId, userId) {
        const snap = await this.db.collection(COL(organizationId)).where('userId', '==', userId).limit(1).get();
        if (snap.empty)
            return null;
        return snap.docs[0].data();
    }
    async list(organizationId) {
        const snap = await this.db.collection(COL(organizationId)).orderBy('createdAt', 'asc').get();
        return snap.docs.map((d) => d.data());
    }
    async count(organizationId) {
        const snap = await this.db.collection(COL(organizationId)).where('status', '==', 'active').count().get();
        return snap.data().count;
    }
    async updateRole(organizationId, memberId, role) {
        const ref = this.db.collection(COL(organizationId)).doc(memberId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ role, updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
    async addWorkspace(organizationId, memberId, workspaceId) {
        const ref = this.db.collection(COL(organizationId)).doc(memberId);
        const snap = await ref.get();
        if (!snap.exists)
            return;
        const record = snap.data();
        if (!record.workspaceIds.includes(workspaceId)) {
            await ref.update({ workspaceIds: [...record.workspaceIds, workspaceId], updatedAt: new Date().toISOString() });
        }
    }
    async remove(organizationId, memberId) {
        const ref = this.db.collection(COL(organizationId)).doc(memberId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ status: 'removed', updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
}
exports.MemberManager = MemberManager;
//# sourceMappingURL=MemberManager.js.map