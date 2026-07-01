"use strict";
/**
 * MeetingMemoryBridge.ts — links meeting sessions to the Memory Graph.
 *
 * Stores: meeting → participants → contacts → tasks → reminders →
 *         documents → approvals → follow-ups.
 * Transcript chunks are stored in Firestore (MeetingTranscriptionEngine),
 * not in the Memory Graph, to preserve privacy isolation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingMemoryBridge = void 0;
const memory_graph_1 = require("../memory-graph");
const MeetingLogger_1 = require("./MeetingLogger");
class MeetingMemoryBridge {
    constructor(db, apiKey) {
        this.db = db;
        this.apiKey = apiKey;
        this.logger = new MeetingLogger_1.MeetingLogger();
    }
    /**
     * Link a meeting session node to the Memory Graph.
     * Stores meeting metadata only — not raw transcript content.
     */
    async linkMeetingSession(userId, session) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            await graph.upsertNode('meeting', `Meeting: ${session.title}`, `${session.type} meeting on ${session.startedAt ?? session.createdAt}`, {
                sessionId: session.sessionId,
                tenantId: session.tenantId,
                type: session.type,
                status: session.status,
                startedAt: session.startedAt,
                endedAt: session.endedAt,
            }, 0.5);
            this.logger.log('memory_meeting_linked', session.sessionId);
        }
        catch (err) {
            this.logger.error('memory_meeting_link_failed', session.sessionId, err);
        }
    }
    /**
     * Link a meeting summary to the Memory Graph.
     */
    async linkSummary(userId, session, summary) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            // Link people mentioned
            for (const person of summary.peopleMentioned) {
                await graph.upsertNode('person', person, `Mentioned in meeting: ${session.title}`, {
                    sessionId: session.sessionId,
                }, 0.5);
            }
            // Link documents mentioned
            for (const doc of summary.documentsMentioned) {
                await graph.upsertNode('document', doc, `Referenced in meeting: ${session.title}`, {
                    sessionId: session.sessionId,
                }, 0.5);
            }
            this.logger.log('memory_summary_linked', session.sessionId);
        }
        catch (err) {
            this.logger.error('memory_summary_link_failed', session.sessionId, err);
        }
    }
    /**
     * Link a follow-up approval request to the Memory Graph.
     */
    async linkApprovalRequest(userId, sessionId, approvalRequestId, description) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            await graph.upsertNode('task', `Approval: ${description}`, description, {
                sessionId,
                approvalRequestId,
                type: 'meetingApproval',
            }, 0.5);
            this.logger.log('memory_approval_linked', sessionId);
        }
        catch (err) {
            this.logger.error('memory_approval_link_failed', sessionId, err);
        }
    }
}
exports.MeetingMemoryBridge = MeetingMemoryBridge;
//# sourceMappingURL=MeetingMemoryBridge.js.map