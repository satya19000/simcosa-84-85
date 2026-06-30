"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationManager = void 0;
const uuid_1 = require("uuid");
const COL = (organizationId) => `organizations/${organizationId}/invitations`;
/** Repository for organizations/{organizationId}/invitations/{invitationId}. Owns ALL raw Firestore access for this collection. */
class InvitationManager {
    constructor(db) {
        this.db = db;
    }
    async create(organizationId, createdBy, input) {
        const invitationId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
            id: invitationId,
            organizationId,
            invitationId,
            email: input.email.trim().toLowerCase(),
            role: input.role,
            workspaceId: input.workspaceId ?? null,
            status: 'pending',
            invitedBy: createdBy,
            createdBy,
            createdAt: now,
            updatedAt: now,
            expiresAt: input.expiresAt,
            acceptedBy: null,
            acceptedAt: null,
        };
        await this.db.collection(COL(organizationId)).doc(invitationId).set(record);
        return record;
    }
    async get(organizationId, invitationId) {
        const snap = await this.db.collection(COL(organizationId)).doc(invitationId).get();
        return snap.exists ? snap.data() : null;
    }
    async list(organizationId) {
        const snap = await this.db.collection(COL(organizationId)).orderBy('createdAt', 'desc').get();
        return snap.docs.map((d) => d.data());
    }
    async markAccepted(organizationId, invitationId, acceptedBy) {
        const ref = this.db.collection(COL(organizationId)).doc(invitationId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        const now = new Date().toISOString();
        await ref.update({ status: 'accepted', acceptedBy, acceptedAt: now, updatedAt: now });
        const updated = await ref.get();
        return updated.data();
    }
    async markDeclined(organizationId, invitationId) {
        const ref = this.db.collection(COL(organizationId)).doc(invitationId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ status: 'declined', updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
    async revoke(organizationId, invitationId) {
        const ref = this.db.collection(COL(organizationId)).doc(invitationId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ status: 'revoked', updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
    async markExpired(organizationId, invitationId) {
        const ref = this.db.collection(COL(organizationId)).doc(invitationId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ status: 'expired', updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
}
exports.InvitationManager = InvitationManager;
//# sourceMappingURL=InvitationManager.js.map