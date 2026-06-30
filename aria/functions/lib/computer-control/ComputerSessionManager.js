"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerSessionManager = void 0;
const uuid_1 = require("uuid");
const SESSION_COL = (tenantId) => `tenants/${tenantId}/computerSessions`;
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour
/**
 * Repository for computer-control sessions.
 * Sessions scope capability grants and approval references for a single
 * user interaction with the computer-control subsystem.
 */
class ComputerSessionManager {
    constructor(db, tenants) {
        this.db = db;
        this.tenants = tenants;
    }
    async createSession(tenantId, userId, capabilities, deviceId = null) {
        await this.tenants.requireIdentity(tenantId, userId);
        const sessionId = (0, uuid_1.v4)();
        const now = new Date();
        const session = {
            sessionId,
            userId,
            tenantId,
            deviceId,
            startedAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
            status: 'active',
            capabilities,
            approvals: [],
            auditTrail: [],
        };
        await this.db.collection(SESSION_COL(tenantId)).doc(sessionId).set(session);
        return session;
    }
    async getSession(tenantId, sessionId) {
        const snap = await this.db.collection(SESSION_COL(tenantId)).doc(sessionId).get();
        if (!snap.exists)
            return null;
        const session = snap.data();
        // Expire stale sessions
        if (new Date(session.expiresAt) < new Date() && session.status === 'active') {
            await snap.ref.update({ status: 'expired' });
            return { ...session, status: 'expired' };
        }
        return session;
    }
    async revokeSession(tenantId, userId, sessionId) {
        await this.tenants.requireIdentity(tenantId, userId);
        await this.db.collection(SESSION_COL(tenantId)).doc(sessionId).update({
            status: 'revoked',
        });
    }
    async addApproval(tenantId, sessionId, approvalRequestId) {
        const ref = this.db.collection(SESSION_COL(tenantId)).doc(sessionId);
        const snap = await ref.get();
        if (!snap.exists)
            return;
        const session = snap.data();
        await ref.update({ approvals: [...session.approvals, approvalRequestId] });
    }
    async addAuditEvent(tenantId, sessionId, auditId) {
        const ref = this.db.collection(SESSION_COL(tenantId)).doc(sessionId);
        const snap = await ref.get();
        if (!snap.exists)
            return;
        const session = snap.data();
        await ref.update({ auditTrail: [...session.auditTrail, auditId] });
    }
}
exports.ComputerSessionManager = ComputerSessionManager;
//# sourceMappingURL=ComputerSessionManager.js.map