"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentMetadata = void 0;
const COL = (userId) => `users/${userId}/documentMetadata`;
class DocumentMetadata {
    constructor(db) {
        this.db = db;
    }
    async save(record) {
        await this.db.collection(COL(record.userId)).doc(record.documentId).set(record);
    }
    async get(userId, documentId) {
        const snap = await this.db.collection(COL(userId)).doc(documentId).get();
        return snap.exists ? snap.data() : null;
    }
    async update(userId, documentId, patch) {
        await this.db.collection(COL(userId)).doc(documentId).set(patch, { merge: true });
    }
}
exports.DocumentMetadata = DocumentMetadata;
//# sourceMappingURL=DocumentMetadata.js.map