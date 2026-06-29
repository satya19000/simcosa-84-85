"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentChunker = void 0;
const COL = (userId) => `users/${userId}/documentChunks`;
/**
 * Stores and retrieves document chunks.
 * Chunking logic lives in DocumentParser; this class is pure persistence.
 */
class DocumentChunker {
    constructor(db) {
        this.db = db;
    }
    async saveChunks(chunks) {
        if (chunks.length === 0)
            return;
        const batch = this.db.batch();
        for (const chunk of chunks) {
            const ref = this.db.collection(COL(chunk.userId)).doc(chunk.id);
            batch.set(ref, chunk);
        }
        await batch.commit();
    }
    async getChunks(userId, documentId) {
        const snap = await this.db
            .collection(COL(userId))
            .where('documentId', '==', documentId)
            .orderBy('index')
            .get();
        return snap.docs.map((d) => d.data());
    }
    async deleteChunks(userId, documentId) {
        const snap = await this.db
            .collection(COL(userId))
            .where('documentId', '==', documentId)
            .get();
        const batch = this.db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
    }
    async countChunks(userId, documentId) {
        const snap = await this.db
            .collection(COL(userId))
            .where('documentId', '==', documentId)
            .count()
            .get();
        return snap.data().count;
    }
    async searchChunks(userId, keyword, limit = 20) {
        // Firestore doesn't support full-text — load and filter in-memory (for small collections)
        // Production: use a proper search index or Algolia
        const snap = await this.db
            .collection(COL(userId))
            .limit(2000)
            .get();
        const lower = keyword.toLowerCase();
        return snap.docs
            .map((d) => d.data())
            .filter((c) => c.text.toLowerCase().includes(lower))
            .slice(0, limit);
    }
}
exports.DocumentChunker = DocumentChunker;
//# sourceMappingURL=DocumentChunker.js.map