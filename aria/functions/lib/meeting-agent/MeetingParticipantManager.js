"use strict";
/**
 * MeetingParticipantManager.ts — manages participants in a meeting session.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingParticipantManager = void 0;
const uuid_1 = require("uuid");
const PARTICIPANTS_COL = (tenantId) => `tenants/${tenantId}/meetingParticipants`;
class MeetingParticipantManager {
    constructor(db) {
        this.db = db;
    }
    async addParticipant(input) {
        const participantId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const participant = {
            participantId,
            sessionId: input.sessionId,
            tenantId: input.tenantId,
            userId: input.userId,
            name: input.name.trim(),
            email: input.email,
            phone: input.phone,
            role: input.role,
            consentStatus: input.consentStatus ?? 'pending',
            consentNotes: input.consentNotes,
            joinedAt: now,
            createdAt: now,
            updatedAt: now,
        };
        await this.db
            .collection(PARTICIPANTS_COL(input.tenantId))
            .doc(participantId)
            .set(participant);
        return participant;
    }
    async updateParticipantConsent(tenantId, participantId, consentStatus, notes) {
        const now = new Date().toISOString();
        await this.db
            .collection(PARTICIPANTS_COL(tenantId))
            .doc(participantId)
            .update({ consentStatus, consentNotes: notes, updatedAt: now });
    }
    async listParticipants(tenantId, sessionId) {
        const snap = await this.db
            .collection(PARTICIPANTS_COL(tenantId))
            .where('sessionId', '==', sessionId)
            .get();
        return snap.docs.map((d) => d.data());
    }
    async markLeft(tenantId, participantId) {
        const now = new Date().toISOString();
        await this.db
            .collection(PARTICIPANTS_COL(tenantId))
            .doc(participantId)
            .update({ leftAt: now, updatedAt: now });
    }
}
exports.MeetingParticipantManager = MeetingParticipantManager;
//# sourceMappingURL=MeetingParticipantManager.js.map