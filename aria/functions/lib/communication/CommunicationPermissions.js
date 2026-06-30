"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationPermissions = void 0;
const COL = (userId) => `users/${userId}/communicationPermissions`;
class CommunicationPermissions {
    constructor(db) {
        this.db = db;
    }
    async grant(userId, threadId, role) {
        const record = {
            userId,
            threadId,
            role,
            grantedAt: new Date().toISOString(),
        };
        await this.db.collection(COL(userId)).doc(threadId).set(record);
    }
    async revoke(userId, threadId) {
        await this.db.collection(COL(userId)).doc(threadId).delete();
    }
    async get(userId, threadId) {
        const snap = await this.db.collection(COL(userId)).doc(threadId).get();
        return snap.exists ? snap.data() : null;
    }
    async canAccess(userId, threadId, minRole = 'reader') {
        const record = await this.get(userId, threadId);
        if (!record)
            return false;
        const order = ['reader', 'agent', 'plugin', 'owner'];
        return order.indexOf(record.role) >= order.indexOf(minRole);
    }
}
exports.CommunicationPermissions = CommunicationPermissions;
//# sourceMappingURL=CommunicationPermissions.js.map