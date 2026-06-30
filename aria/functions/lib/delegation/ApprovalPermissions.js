"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalPermissions = void 0;
const COL = (userId) => `users/${userId}/approvalPermissions`;
class ApprovalPermissions {
    constructor(db) {
        this.db = db;
    }
    async grant(userId, scopeId, role) {
        const record = {
            userId,
            scopeId,
            role,
            grantedAt: new Date().toISOString(),
        };
        await this.db.collection(COL(userId)).doc(scopeId).set(record);
    }
    async revoke(userId, scopeId) {
        await this.db.collection(COL(userId)).doc(scopeId).delete();
    }
    async get(userId, scopeId) {
        const snap = await this.db.collection(COL(userId)).doc(scopeId).get();
        return snap.exists ? snap.data() : null;
    }
    async canAccess(userId, scopeId, minRole = 'reader') {
        const record = await this.get(userId, scopeId);
        if (!record)
            return false;
        const order = ['reader', 'approver', 'manager', 'executive', 'admin'];
        return order.indexOf(record.role) >= order.indexOf(minRole);
    }
}
exports.ApprovalPermissions = ApprovalPermissions;
//# sourceMappingURL=ApprovalPermissions.js.map