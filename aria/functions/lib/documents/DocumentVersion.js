"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentVersionManager = void 0;
const uuid_1 = require("uuid");
const COL = (userId) => `users/${userId}/documentVersions`;
class DocumentVersionManager {
    constructor(db) {
        this.db = db;
    }
    async save(userId, documentId, version, storageRef, sizeBytes, changeNote) {
        const record = {
            id: (0, uuid_1.v4)(),
            documentId,
            userId,
            version,
            storageRef,
            sizeBytes,
            changeNote,
            uploadedAt: new Date().toISOString(),
        };
        await this.db.collection(COL(userId)).doc(record.id).set(record);
        return record;
    }
    async listVersions(userId, documentId) {
        const snap = await this.db
            .collection(COL(userId))
            .where('documentId', '==', documentId)
            .orderBy('version', 'desc')
            .get();
        return snap.docs.map((d) => d.data());
    }
    async getVersion(userId, versionId) {
        const snap = await this.db.collection(COL(userId)).doc(versionId).get();
        return snap.exists ? snap.data() : null;
    }
}
exports.DocumentVersionManager = DocumentVersionManager;
//# sourceMappingURL=DocumentVersion.js.map