"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalHistory = void 0;
const uuid_1 = require("uuid");
const COL = (userId) => `users/${userId}/approvalHistory`;
/** Immutable audit log over users/{userId}/approvalHistory. Append-only. */
class ApprovalHistory {
    constructor(db) {
        this.db = db;
    }
    async record(userId, entry) {
        const full = {
            id: (0, uuid_1.v4)(),
            at: new Date().toISOString(),
            ...entry,
        };
        await this.db.collection(COL(userId)).doc(full.id).set(full);
        return full;
    }
    async listForRequest(userId, requestId) {
        const snap = await this.db.collection(COL(userId)).where('requestId', '==', requestId).orderBy('at', 'asc').get();
        return snap.docs.map((d) => d.data());
    }
    async listAll(userId, filters = {}) {
        let query = this.db.collection(COL(userId));
        if (filters.action)
            query = query.where('action', '==', filters.action);
        query = query.orderBy('at', 'desc').limit(filters.limit ?? 100);
        const snap = await query.get();
        return snap.docs.map((d) => d.data());
    }
}
exports.ApprovalHistory = ApprovalHistory;
//# sourceMappingURL=ApprovalHistory.js.map