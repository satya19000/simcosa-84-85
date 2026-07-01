"use strict";
/**
 * MeetingAnalytics.ts — lightweight analytics for meeting sessions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingAnalytics = void 0;
class MeetingAnalytics {
    constructor(db) {
        this.db = db;
    }
    async getStats(tenantId, userId) {
        const snap = await this.db
            .collection(`tenants/${tenantId}/meetingSessions`)
            .where('userId', '==', userId)
            .get();
        const sessions = snap.docs.map((d) => d.data());
        const byStatus = {};
        const byType = {};
        let totalDurationMs = 0;
        let sessionsWithDuration = 0;
        for (const session of sessions) {
            byStatus[session.status] = (byStatus[session.status] ?? 0) + 1;
            byType[session.type] = (byType[session.type] ?? 0) + 1;
            if (session.startedAt && session.endedAt) {
                const duration = new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime();
                totalDurationMs += duration;
                sessionsWithDuration++;
            }
        }
        return {
            totalSessions: sessions.length,
            byStatus,
            byType,
            averageDurationMs: sessionsWithDuration > 0 ? totalDurationMs / sessionsWithDuration : null,
            totalTranscriptChunks: 0, // would require a separate query; left as placeholder
        };
    }
}
exports.MeetingAnalytics = MeetingAnalytics;
//# sourceMappingURL=MeetingAnalytics.js.map