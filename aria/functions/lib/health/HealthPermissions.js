"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthPermissions = void 0;
const COL = (userId) => `users/${userId}/healthPermissions`;
class HealthPermissions {
    constructor(db) {
        this.db = db;
    }
    async grant(userId, patientId, role) {
        const record = {
            userId,
            patientId,
            role,
            grantedAt: new Date().toISOString(),
        };
        await this.db.collection(COL(userId)).doc(patientId).set(record);
    }
    async revoke(userId, patientId) {
        await this.db.collection(COL(userId)).doc(patientId).delete();
    }
    async get(userId, patientId) {
        const snap = await this.db.collection(COL(userId)).doc(patientId).get();
        return snap.exists ? snap.data() : null;
    }
    async canAccess(userId, patientId, minRole = 'reader') {
        const record = await this.get(userId, patientId);
        if (!record)
            return false;
        const order = ['reader', 'health_worker', 'doctor', 'admin'];
        return order.indexOf(record.role) >= order.indexOf(minRole);
    }
}
exports.HealthPermissions = HealthPermissions;
//# sourceMappingURL=HealthPermissions.js.map