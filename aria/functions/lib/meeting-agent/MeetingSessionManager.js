"use strict";
/**
 * MeetingSessionManager.ts — CRUD for meeting sessions in Firestore.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingSessionManager = void 0;
const uuid_1 = require("uuid");
const SESSIONS_COL = (tenantId) => `tenants/${tenantId}/meetingSessions`;
class MeetingSessionManager {
    constructor(db, config) {
        this.db = db;
        this.config = config;
    }
    async createSession(input) {
        const sessionId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const session = {
            sessionId,
            userId: input.userId,
            tenantId: input.tenantId,
            title: input.title.trim(),
            type: input.type,
            participants: [],
            consentStatus: 'pending',
            status: 'consentRequired',
            recordingEnabled: this.config.recordingEnabledByDefault,
            transcriptionEnabled: input.transcriptionEnabled ?? true,
            aiSummaryEnabled: input.aiSummaryEnabled ?? this.config.aiSummaryEnabledByDefault,
            language: input.language,
            location: input.location,
            platform: input.platform,
            tags: input.tags ?? [],
            notes: input.notes,
            createdAt: now,
            updatedAt: now,
        };
        await this.db
            .collection(SESSIONS_COL(input.tenantId))
            .doc(sessionId)
            .set(session);
        return session;
    }
    async getSession(tenantId, sessionId) {
        const snap = await this.db
            .collection(SESSIONS_COL(tenantId))
            .doc(sessionId)
            .get();
        return snap.exists ? snap.data() : null;
    }
    async updateStatus(tenantId, sessionId, status, extra) {
        const now = new Date().toISOString();
        await this.db
            .collection(SESSIONS_COL(tenantId))
            .doc(sessionId)
            .update({ status, updatedAt: now, ...(extra ?? {}) });
    }
    async listSessions(tenantId, userId, limit = 50) {
        const snap = await this.db
            .collection(SESSIONS_COL(tenantId))
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map((d) => d.data());
    }
    async deleteSession(tenantId, sessionId) {
        const now = new Date().toISOString();
        await this.db
            .collection(SESSIONS_COL(tenantId))
            .doc(sessionId)
            .update({ status: 'deleted', updatedAt: now });
    }
}
exports.MeetingSessionManager = MeetingSessionManager;
//# sourceMappingURL=MeetingSessionManager.js.map