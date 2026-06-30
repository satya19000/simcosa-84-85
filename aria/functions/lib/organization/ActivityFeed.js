"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityFeed = void 0;
const uuid_1 = require("uuid");
const WorkspaceEvents_1 = require("./WorkspaceEvents");
const COL = (organizationId) => `organizations/${organizationId}/activity`;
/**
 * Repository for organizations/{organizationId}/activity/{activityId}.
 * Owns ALL raw Firestore access for this collection, and emits the
 * corresponding in-process WorkspaceEvents entry alongside each write.
 *
 * Foundation-only: this writes Firestore documents that a client can read
 * via listActivity() (poll-based). There is no live onSnapshot listener
 * wired here — see README "Future Phase TODO" for real-time push.
 */
class ActivityFeed {
    constructor(db) {
        this.db = db;
    }
    async record(organizationId, actorId, type, summary, opts = {}) {
        const activityId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
            id: activityId,
            organizationId,
            activityId,
            type,
            actorId,
            summary,
            workspaceId: opts.workspaceId ?? null,
            targetId: opts.targetId ?? null,
            metadata: opts.metadata ?? {},
            createdBy: actorId,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(COL(organizationId)).doc(activityId).set(record);
        WorkspaceEvents_1.WorkspaceEvents.emit(type, { organizationId, type, actorId, activity: record });
        return record;
    }
    async list(organizationId, limit = 50) {
        const snap = await this.db
            .collection(COL(organizationId))
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map((d) => d.data());
    }
    async listForWorkspace(organizationId, workspaceId, limit = 50) {
        const snap = await this.db
            .collection(COL(organizationId))
            .where('workspaceId', '==', workspaceId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map((d) => d.data());
    }
    async count(organizationId) {
        const snap = await this.db.collection(COL(organizationId)).count().get();
        return snap.data().count;
    }
}
exports.ActivityFeed = ActivityFeed;
//# sourceMappingURL=ActivityFeed.js.map