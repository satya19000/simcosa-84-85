"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalQueue = void 0;
const uuid_1 = require("uuid");
const ApprovalEvents_1 = require("./ApprovalEvents");
const COL = (userId) => `users/${userId}/approvalRequests`;
/**
 * Firestore-backed repository over users/{userId}/approvalRequests.
 * NEVER executes anything — this class only manages approval state. Every
 * transition appends a history entry and emits the matching ApprovalEvents
 * event; actual side effects (sending email, deleting records, etc.) live in
 * ApprovalRegistry executors, invoked only by ApprovalEngine after a request
 * has genuinely reached status 'approved'.
 */
class ApprovalQueue {
    constructor(db) {
        this.db = db;
    }
    async create(request) {
        await this.db.collection(COL(request.userId)).doc(request.id).set(request);
        void ApprovalEvents_1.ApprovalEvents.emit('approval:created', request.userId, { requestId: request.id, triggerType: request.triggerType, riskScore: request.riskScore });
        return request;
    }
    async get(userId, id) {
        const snap = await this.db.collection(COL(userId)).doc(id).get();
        return snap.exists ? snap.data() : null;
    }
    async update(userId, id, patch) {
        await this.db.collection(COL(userId)).doc(id).update({
            ...patch,
            updatedAt: new Date().toISOString(),
        });
    }
    async list(userId, filters = {}) {
        let query = this.db.collection(COL(userId));
        if (filters.status)
            query = query.where('status', '==', filters.status);
        if (filters.approvalLevel)
            query = query.where('approvalLevel', '==', filters.approvalLevel);
        if (filters.triggerType)
            query = query.where('triggerType', '==', filters.triggerType);
        const snap = await query.limit(filters.limit ?? 200).get();
        let results = snap.docs.map((d) => d.data());
        if (filters.search) {
            const term = filters.search.toLowerCase();
            results = results.filter((r) => r.title.toLowerCase().includes(term));
        }
        // Priority sort: highest risk first, then soonest-expiring first.
        results.sort((a, b) => b.riskScore - a.riskScore || Date.parse(a.expiresAt) - Date.parse(b.expiresAt));
        return results;
    }
    async listPending(userId) {
        return this.list(userId, { status: 'pending' });
    }
    async listUrgent(userId, withinMs = 2 * 60 * 60 * 1000) {
        const pending = await this.listPending(userId);
        const now = Date.now();
        return pending.filter((r) => Date.parse(r.expiresAt) - now <= withinMs && Date.parse(r.expiresAt) - now > 0);
    }
    async listExpired(userId) {
        return this.list(userId, { status: 'expired' });
    }
    async appendHistory(userId, id, action, actor, notes) {
        const request = await this.get(userId, id);
        if (!request)
            return;
        const entry = { id: (0, uuid_1.v4)(), action, actor, notes, at: new Date().toISOString() };
        await this.update(userId, id, { history: [...request.history, entry] });
    }
    async approve(userId, id, approvedBy) {
        const request = await this.get(userId, id);
        if (!request)
            return null;
        await this.update(userId, id, { status: 'approved' });
        await this.appendHistory(userId, id, 'approved', approvedBy);
        void ApprovalEvents_1.ApprovalEvents.emit('approval:approved', userId, { requestId: id, approvedBy });
        return this.get(userId, id);
    }
    async reject(userId, id, rejectedBy, reason) {
        const request = await this.get(userId, id);
        if (!request)
            return null;
        await this.update(userId, id, { status: 'rejected' });
        await this.appendHistory(userId, id, 'rejected', rejectedBy, reason);
        void ApprovalEvents_1.ApprovalEvents.emit('approval:rejected', userId, { requestId: id, rejectedBy, reason });
        return this.get(userId, id);
    }
    async cancel(userId, id, cancelledBy, reason) {
        const request = await this.get(userId, id);
        if (!request)
            return null;
        await this.update(userId, id, { status: 'cancelled' });
        await this.appendHistory(userId, id, 'cancelled', cancelledBy, reason);
        void ApprovalEvents_1.ApprovalEvents.emit('approval:cancelled', userId, { requestId: id, cancelledBy, reason });
        return this.get(userId, id);
    }
    async markExpired(userId, id) {
        const request = await this.get(userId, id);
        if (!request)
            return null;
        await this.update(userId, id, { status: 'expired' });
        await this.appendHistory(userId, id, 'expired', 'system');
        void ApprovalEvents_1.ApprovalEvents.emit('approval:expired', userId, { requestId: id });
        return this.get(userId, id);
    }
    async markExecuted(userId, id, executedBy) {
        const request = await this.get(userId, id);
        if (!request)
            return null;
        const executedAt = new Date().toISOString();
        await this.update(userId, id, { status: 'executed', executedAt });
        await this.appendHistory(userId, id, 'executed', executedBy);
        void ApprovalEvents_1.ApprovalEvents.emit('approval:executed', userId, { requestId: id, executedAt });
        return this.get(userId, id);
    }
    async markRolledBack(userId, id, rolledBackBy, reason) {
        const request = await this.get(userId, id);
        if (!request)
            return null;
        const rolledBackAt = new Date().toISOString();
        await this.update(userId, id, { status: 'rolled_back', rolledBackAt });
        await this.appendHistory(userId, id, 'rolled_back', rolledBackBy, reason);
        void ApprovalEvents_1.ApprovalEvents.emit('approval:rolled_back', userId, { requestId: id, rolledBackAt, reason });
        return this.get(userId, id);
    }
    async delegate(userId, id, delegatedTo, delegatedBy) {
        const request = await this.get(userId, id);
        if (!request)
            return null;
        await this.update(userId, id, { status: 'delegated', delegatedTo });
        await this.appendHistory(userId, id, 'delegated', delegatedBy, `delegated to ${delegatedTo}`);
        void ApprovalEvents_1.ApprovalEvents.emit('approval:delegated', userId, { requestId: id, delegatedTo, delegatedBy });
        return this.get(userId, id);
    }
    async bulkApprove(userId, ids, approvedBy) {
        const results = [];
        for (const id of ids) {
            const r = await this.approve(userId, id, approvedBy);
            if (r)
                results.push(r);
        }
        return results;
    }
    async bulkReject(userId, ids, rejectedBy, reason) {
        const results = [];
        for (const id of ids) {
            const r = await this.reject(userId, id, rejectedBy, reason);
            if (r)
                results.push(r);
        }
        return results;
    }
}
exports.ApprovalQueue = ApprovalQueue;
//# sourceMappingURL=ApprovalQueue.js.map