"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationHistory = void 0;
const MESSAGES_COL = (userId) => `users/${userId}/conversationMessages`;
const THREADS_COL = (userId) => `users/${userId}/conversationThreads`;
class CommunicationHistory {
    constructor(db) {
        this.db = db;
    }
    async getRecentThreads(userId, limit = 20) {
        const snap = await this.db
            .collection(THREADS_COL(userId))
            .where('status', '==', 'active')
            .orderBy('lastMessageAt', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map((d) => d.data());
    }
    async getThreadsByProvider(userId, providerType, limit = 50) {
        const snap = await this.db
            .collection(THREADS_COL(userId))
            .where('providerType', '==', providerType)
            .where('status', '!=', 'deleted')
            .orderBy('lastMessageAt', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map((d) => d.data());
    }
    async getMessagesSince(userId, since, limit = 200) {
        const snap = await this.db
            .collection(MESSAGES_COL(userId))
            .where('receivedAt', '>=', since)
            .orderBy('receivedAt', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map((d) => d.data());
    }
    async getMessagesByParticipant(userId, address, limit = 50) {
        const snap = await this.db
            .collection(MESSAGES_COL(userId))
            .where('from.address', '==', address)
            .orderBy('receivedAt', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map((d) => d.data());
    }
    async countMessagesByProvider(userId) {
        const snap = await this.db
            .collection(MESSAGES_COL(userId))
            .limit(5000)
            .get();
        const counts = {};
        for (const doc of snap.docs) {
            const msg = doc.data();
            counts[msg.providerType] = (counts[msg.providerType] ?? 0) + 1;
        }
        return counts;
    }
    async purgeOldMessages(userId, olderThanDays) {
        const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
        const snap = await this.db
            .collection(MESSAGES_COL(userId))
            .where('receivedAt', '<', cutoff)
            .limit(500)
            .get();
        const batch = this.db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        return snap.size;
    }
}
exports.CommunicationHistory = CommunicationHistory;
//# sourceMappingURL=CommunicationHistory.js.map