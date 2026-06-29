"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowHistory = void 0;
/**
 * Persists and retrieves workflow execution history.
 * Path: users/{userId}/workflowHistory/{executionId}
 */
class WorkflowHistory {
    constructor(db) {
        this.db = db;
    }
    async save(userId, result) {
        await this.db
            .collection('users')
            .doc(userId)
            .collection('workflowHistory')
            .doc(result.executionId)
            .set({
            ...result,
            savedAt: new Date().toISOString(),
        });
    }
    async get(userId, executionId) {
        const snap = await this.db
            .collection('users')
            .doc(userId)
            .collection('workflowHistory')
            .doc(executionId)
            .get();
        return snap.exists ? snap.data() : null;
    }
    async list(userId, opts) {
        let q = this.db
            .collection('users')
            .doc(userId)
            .collection('workflowHistory')
            .orderBy('startedAt', 'desc');
        if (opts?.workflowId)
            q = q.where('workflowId', '==', opts.workflowId);
        if (opts?.status)
            q = q.where('status', '==', opts.status);
        q = q.limit(opts?.limit ?? 50);
        const snap = await q.get();
        return snap.docs.map((d) => d.data());
    }
    async deleteOlderThan(userId, days) {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        const snap = await this.db
            .collection('users')
            .doc(userId)
            .collection('workflowHistory')
            .where('startedAt', '<', cutoff)
            .limit(100)
            .get();
        const batch = this.db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        return snap.size;
    }
}
exports.WorkflowHistory = WorkflowHistory;
//# sourceMappingURL=WorkflowHistory.js.map