"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupManager = void 0;
const uuid_1 = require("uuid");
const GROUPS_COL = (tenantId) => `tenants/${tenantId}/groups`;
/** Repository for tenants/{tenantId}/groups/{groupId}. Tenant-membership gated like every other Manager here. */
class GroupManager {
    constructor(db, tenants) {
        this.db = db;
        this.tenants = tenants;
    }
    async createGroup(tenantId, actorUserId, input) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const groupId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
            id: groupId,
            tenantId,
            groupId,
            name: input.name.trim(),
            description: input.description?.trim() ?? '',
            memberIdentityIds: [],
            roleIds: [],
            createdBy: actorUserId,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(GROUPS_COL(tenantId)).doc(groupId).set(record);
        return record;
    }
    async updateGroup(tenantId, actorUserId, groupId, fields) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const ref = this.db.collection(GROUPS_COL(tenantId)).doc(groupId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ ...fields, updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
    async getGroup(tenantId, actorUserId, groupId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const snap = await this.db.collection(GROUPS_COL(tenantId)).doc(groupId).get();
        return snap.exists ? snap.data() : null;
    }
    async listGroups(tenantId, actorUserId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const snap = await this.db.collection(GROUPS_COL(tenantId)).get();
        return snap.docs.map((d) => d.data());
    }
    async addMemberToGroup(tenantId, actorUserId, groupId, identityId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const ref = this.db.collection(GROUPS_COL(tenantId)).doc(groupId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        const group = snap.data();
        if (!group.memberIdentityIds.includes(identityId)) {
            await ref.update({ memberIdentityIds: [...group.memberIdentityIds, identityId], updatedAt: new Date().toISOString() });
        }
        const updated = await ref.get();
        return updated.data();
    }
    async removeMemberFromGroup(tenantId, actorUserId, groupId, identityId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const ref = this.db.collection(GROUPS_COL(tenantId)).doc(groupId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        const group = snap.data();
        await ref.update({ memberIdentityIds: group.memberIdentityIds.filter((id) => id !== identityId), updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
    async assignRoleToGroup(tenantId, actorUserId, groupId, roleId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const ref = this.db.collection(GROUPS_COL(tenantId)).doc(groupId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        const group = snap.data();
        if (!group.roleIds.includes(roleId)) {
            await ref.update({ roleIds: [...group.roleIds, roleId], updatedAt: new Date().toISOString() });
        }
        const updated = await ref.get();
        return updated.data();
    }
}
exports.GroupManager = GroupManager;
//# sourceMappingURL=GroupManager.js.map