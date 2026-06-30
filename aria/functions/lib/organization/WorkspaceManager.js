"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceManager = void 0;
const uuid_1 = require("uuid");
const COL = (organizationId) => `organizations/${organizationId}/workspaces`;
/** Repository for organizations/{organizationId}/workspaces/{workspaceId}. Owns ALL raw Firestore access for this collection. */
class WorkspaceManager {
    constructor(db) {
        this.db = db;
    }
    async create(organizationId, createdBy, input) {
        const workspaceId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
            id: workspaceId,
            organizationId,
            workspaceId,
            name: input.name.trim(),
            description: input.description?.trim() ?? '',
            managerIds: [createdBy],
            createdBy,
            createdAt: now,
            updatedAt: now,
            archived: false,
        };
        await this.db.collection(COL(organizationId)).doc(workspaceId).set(record);
        return record;
    }
    async get(organizationId, workspaceId) {
        const snap = await this.db.collection(COL(organizationId)).doc(workspaceId).get();
        return snap.exists ? snap.data() : null;
    }
    async list(organizationId) {
        const snap = await this.db.collection(COL(organizationId)).orderBy('createdAt', 'desc').get();
        return snap.docs.map((d) => d.data());
    }
    async count(organizationId) {
        const snap = await this.db.collection(COL(organizationId)).count().get();
        return snap.data().count;
    }
    async update(organizationId, workspaceId, fields) {
        const ref = this.db.collection(COL(organizationId)).doc(workspaceId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ ...fields, updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
    async addManager(organizationId, workspaceId, userId) {
        const ref = this.db.collection(COL(organizationId)).doc(workspaceId);
        const snap = await ref.get();
        if (!snap.exists)
            return;
        const record = snap.data();
        if (!record.managerIds.includes(userId)) {
            await ref.update({ managerIds: [...record.managerIds, userId], updatedAt: new Date().toISOString() });
        }
    }
}
exports.WorkspaceManager = WorkspaceManager;
//# sourceMappingURL=WorkspaceManager.js.map