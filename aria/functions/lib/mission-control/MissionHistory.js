"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionHistory = void 0;
const uuid_1 = require("uuid");
const COL = (userId) => `users/${userId}/missionHistory`;
/** Append-only, durable, queryable, cross-mission audit log — mirrors ApprovalHistory.ts exactly. */
class MissionHistory {
    constructor(db) {
        this.db = db;
    }
    async append(userId, entry) {
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
        query = query.orderBy('at', 'desc').limit(filters.limit ?? 200);
        const snap = await query.get();
        return snap.docs.map((d) => d.data());
    }
}
exports.MissionHistory = MissionHistory;
//# sourceMappingURL=MissionHistory.js.map