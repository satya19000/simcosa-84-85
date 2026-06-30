"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const uuid_1 = require("uuid");
const SESSIONS_COL = (tenantId) => `tenants/${tenantId}/sessions`;
/**
 * Repository for tenants/{tenantId}/sessions/{sessionId}.
 *
 * IMPORTANT — `ipAddress` and `location` are PLACEHOLDER fields only. This
 * module does not perform real IP geolocation or device fingerprinting; the
 * fields exist so a future phase can wire in real values without a schema
 * migration. Treat any non-null value here as caller-supplied metadata, not
 * a verified network fact.
 */
class SessionManager {
    constructor(db, tenants) {
        this.db = db;
        this.tenants = tenants;
    }
    async createSession(tenantId, userId, input) {
        await this.tenants.requireIdentity(tenantId, userId);
        const sessionId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
            id: sessionId,
            tenantId,
            sessionId,
            identityId: input.identityId,
            userId,
            loginAt: now,
            lastActiveAt: now,
            deviceInfo: input.deviceInfo ?? null,
            browser: input.browser ?? null,
            ipAddress: input.ipAddress ?? null, // placeholder, see class doc
            location: input.location ?? null, // placeholder, see class doc
            active: true,
            revokedAt: null,
            createdAt: now,
        };
        await this.db.collection(SESSIONS_COL(tenantId)).doc(sessionId).set(record);
        return record;
    }
    async refreshSession(tenantId, userId, sessionId) {
        await this.tenants.requireIdentity(tenantId, userId);
        const ref = this.db.collection(SESSIONS_COL(tenantId)).doc(sessionId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        const session = snap.data();
        if (!session.active)
            return session;
        await ref.update({ lastActiveAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
    async revokeSession(tenantId, userId, sessionId) {
        await this.tenants.requireIdentity(tenantId, userId);
        const ref = this.db.collection(SESSIONS_COL(tenantId)).doc(sessionId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        const now = new Date().toISOString();
        await ref.update({ active: false, revokedAt: now });
        const updated = await ref.get();
        return updated.data();
    }
    async listSessions(tenantId, userId, forUserId) {
        await this.tenants.requireIdentity(tenantId, userId);
        let query = this.db.collection(SESSIONS_COL(tenantId));
        if (forUserId)
            query = query.where('userId', '==', forUserId);
        const snap = await query.get();
        return snap.docs.map((d) => d.data());
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=SessionManager.js.map