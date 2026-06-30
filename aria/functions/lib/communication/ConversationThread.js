"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationThreadStore = void 0;
const uuid_1 = require("uuid");
const THREADS_COL = (userId) => `users/${userId}/conversationThreads`;
const MESSAGES_COL = (userId) => `users/${userId}/conversationMessages`;
class ConversationThreadStore {
    constructor(db) {
        this.db = db;
    }
    // ── Thread operations ────────────────────────────────────────────────────
    async createThread(userId, fields) {
        const now = new Date().toISOString();
        const thread = {
            ...fields,
            id: (0, uuid_1.v4)(),
            userId,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(THREADS_COL(userId)).doc(thread.id).set(thread);
        return thread;
    }
    async getThread(userId, threadId) {
        const snap = await this.db.collection(THREADS_COL(userId)).doc(threadId).get();
        return snap.exists ? snap.data() : null;
    }
    async updateThread(userId, threadId, patch) {
        await this.db.collection(THREADS_COL(userId)).doc(threadId).set({ ...patch, updatedAt: new Date().toISOString() }, { merge: true });
    }
    async deleteThread(userId, threadId) {
        await this.updateThread(userId, threadId, { status: 'deleted' });
    }
    async listThreads(userId, opts = {}) {
        let query = this.db
            .collection(THREADS_COL(userId))
            .where('status', '!=', 'deleted');
        if (opts.providerType)
            query = query.where('providerType', '==', opts.providerType);
        if (opts.status && opts.status !== 'deleted')
            query = query.where('status', '==', opts.status);
        const snap = await query.orderBy('lastMessageAt', 'desc').limit(opts.limit ?? 100).get();
        return snap.docs.map((d) => d.data());
    }
    async findByProviderThreadId(userId, providerId, providerThreadId) {
        const snap = await this.db
            .collection(THREADS_COL(userId))
            .where('providerId', '==', providerId)
            .where('providerThreadId', '==', providerThreadId)
            .limit(1)
            .get();
        if (snap.empty)
            return null;
        return snap.docs[0].data();
    }
    async countUnread(userId) {
        const snap = await this.db
            .collection(THREADS_COL(userId))
            .where('unreadCount', '>', 0)
            .where('status', '==', 'active')
            .count()
            .get();
        return snap.data().count;
    }
    // ── Message operations ───────────────────────────────────────────────────
    async saveMessage(message) {
        await this.db.collection(MESSAGES_COL(message.userId)).doc(message.id).set(message);
        // Update thread stats
        await this.db.collection(THREADS_COL(message.userId)).doc(message.threadId).set({
            lastMessageAt: message.receivedAt,
            lastMessagePreview: message.body.slice(0, 120),
            updatedAt: new Date().toISOString(),
        }, { merge: true });
    }
    async getMessages(userId, threadId, limit = 50) {
        const snap = await this.db
            .collection(MESSAGES_COL(userId))
            .where('threadId', '==', threadId)
            .orderBy('receivedAt', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map((d) => d.data()).reverse();
    }
    async getMessage(userId, messageId) {
        const snap = await this.db.collection(MESSAGES_COL(userId)).doc(messageId).get();
        return snap.exists ? snap.data() : null;
    }
    async markRead(userId, threadId) {
        await this.db.collection(THREADS_COL(userId)).doc(threadId).set({ unreadCount: 0, updatedAt: new Date().toISOString() }, { merge: true });
    }
    async searchMessages(userId, query, limit = 20) {
        const snap = await this.db
            .collection(MESSAGES_COL(userId))
            .orderBy('receivedAt', 'desc')
            .limit(2000)
            .get();
        const lower = query.toLowerCase();
        return snap.docs
            .map((d) => d.data())
            .filter((m) => m.body.toLowerCase().includes(lower) || (m.subject ?? '').toLowerCase().includes(lower))
            .slice(0, limit);
    }
}
exports.ConversationThreadStore = ConversationThreadStore;
//# sourceMappingURL=ConversationThread.js.map