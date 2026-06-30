"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationScheduler = void 0;
const uuid_1 = require("uuid");
const COL = (userId) => `users/${userId}/scheduledMessages`;
class CommunicationScheduler {
    constructor(db, registry) {
        this.db = db;
        this.registry = registry;
    }
    async schedule(userId, fields) {
        const now = new Date().toISOString();
        const msg = {
            ...fields,
            id: (0, uuid_1.v4)(),
            status: 'pending',
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(COL(userId)).doc(msg.id).set(msg);
        return msg;
    }
    async cancel(userId, messageId) {
        await this.db.collection(COL(userId)).doc(messageId).set({ status: 'cancelled', updatedAt: new Date().toISOString() }, { merge: true });
    }
    async listPending(userId) {
        const snap = await this.db
            .collection(COL(userId))
            .where('status', '==', 'pending')
            .orderBy('scheduledFor')
            .get();
        return snap.docs.map((d) => d.data());
    }
    /** Process due messages across all users (called from a scheduled Cloud Function). */
    async processDue(userId) {
        const now = new Date().toISOString();
        const snap = await this.db
            .collection(COL(userId))
            .where('status', '==', 'pending')
            .where('scheduledFor', '<=', now)
            .limit(50)
            .get();
        let sent = 0;
        let failed = 0;
        for (const doc of snap.docs) {
            const msg = doc.data();
            const provider = this.registry.getProvider(msg.providerId);
            if (!provider) {
                await doc.ref.set({ status: 'failed', updatedAt: now }, { merge: true });
                failed++;
                continue;
            }
            try {
                await provider.send(userId, {
                    to: msg.to,
                    body: msg.body,
                    subject: msg.subject,
                    contentType: msg.contentType,
                });
                await doc.ref.set({ status: 'sent', updatedAt: now }, { merge: true });
                sent++;
            }
            catch {
                await doc.ref.set({ status: 'failed', updatedAt: now }, { merge: true });
                failed++;
            }
        }
        return { sent, failed };
    }
}
exports.CommunicationScheduler = CommunicationScheduler;
//# sourceMappingURL=CommunicationScheduler.js.map