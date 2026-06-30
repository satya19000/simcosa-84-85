"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationMemory = void 0;
const COL = (userId) => `users/${userId}/communicationMemory`;
class ConversationMemory {
    constructor(db) {
        this.db = db;
    }
    async getStyle(userId, contactId) {
        const snap = await this.db.collection(COL(userId)).doc(contactId).get();
        return snap.exists ? snap.data() : null;
    }
    async updateStyle(userId, contactId, patch) {
        const existing = await this.getStyle(userId, contactId);
        const now = new Date().toISOString();
        const updated = {
            contactId,
            userId,
            interactionCount: 0,
            ...existing,
            ...patch,
            updatedAt: now,
        };
        await this.db.collection(COL(userId)).doc(contactId).set(updated);
    }
    async recordInteraction(userId, contactId, channel) {
        const existing = await this.getStyle(userId, contactId);
        const count = (existing?.interactionCount ?? 0) + 1;
        await this.updateStyle(userId, contactId, {
            preferredChannel: existing?.preferredChannel ?? channel,
            interactionCount: count,
            lastInteractionAt: new Date().toISOString(),
        });
    }
    async listAll(userId) {
        const snap = await this.db.collection(COL(userId)).orderBy('interactionCount', 'desc').limit(200).get();
        return snap.docs.map((d) => d.data());
    }
    async delete(userId, contactId) {
        await this.db.collection(COL(userId)).doc(contactId).delete();
    }
}
exports.ConversationMemory = ConversationMemory;
//# sourceMappingURL=ConversationMemory.js.map