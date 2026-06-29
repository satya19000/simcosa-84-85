"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentRegistry = void 0;
const uuid_1 = require("uuid");
const COL = (userId) => `users/${userId}/documents`;
const FOLDERS_COL = (userId) => `users/${userId}/documentFolders`;
/**
 * Firestore persistence layer for DocumentRecord.
 * All document reads/writes go through this class.
 */
class DocumentRegistry {
    constructor(db) {
        this.db = db;
    }
    async create(userId, fields) {
        const now = new Date().toISOString();
        const record = {
            ...fields,
            id: (0, uuid_1.v4)(),
            userId,
            version: 1,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(COL(userId)).doc(record.id).set(record);
        return record;
    }
    async get(userId, documentId) {
        const snap = await this.db.collection(COL(userId)).doc(documentId).get();
        return snap.exists ? snap.data() : null;
    }
    async update(userId, documentId, patch) {
        const existing = await this.get(userId, documentId);
        if (!existing)
            return null;
        const updated = {
            ...existing,
            ...patch,
            id: documentId,
            userId,
            version: existing.version + 1,
            updatedAt: new Date().toISOString(),
        };
        await this.db.collection(COL(userId)).doc(documentId).set(updated);
        return updated;
    }
    async setStatus(userId, documentId, status, error) {
        const patch = { status, updatedAt: new Date().toISOString() };
        if (error)
            patch.processingError = error;
        if (status === 'indexed')
            patch.processedAt = new Date().toISOString();
        await this.db.collection(COL(userId)).doc(documentId).set(patch, { merge: true });
    }
    async softDelete(userId, documentId) {
        await this.setStatus(userId, documentId, 'deleted');
    }
    async list(userId, opts = {}) {
        let query = this.db
            .collection(COL(userId))
            .where('status', '!=', 'deleted');
        if (opts.category)
            query = query.where('category', '==', opts.category);
        if (opts.format)
            query = query.where('format', '==', opts.format);
        if (opts.folderId !== undefined)
            query = query.where('folderId', '==', opts.folderId);
        const snap = await query.orderBy('updatedAt', 'desc').limit(opts.limit ?? 100).get();
        return snap.docs.map((d) => d.data());
    }
    async listRecent(userId, days = 7, limit = 20) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        const snap = await this.db
            .collection(COL(userId))
            .where('createdAt', '>=', since)
            .where('status', '!=', 'deleted')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map((d) => d.data());
    }
    async count(userId) {
        const snap = await this.db
            .collection(COL(userId))
            .where('status', '!=', 'deleted')
            .count()
            .get();
        return snap.data().count;
    }
    async createFolder(userId, name, parentId, color) {
        const now = new Date().toISOString();
        const folder = { id: (0, uuid_1.v4)(), userId, name, parentId, color, createdAt: now, updatedAt: now };
        await this.db.collection(FOLDERS_COL(userId)).doc(folder.id).set(folder);
        return folder;
    }
    async listFolders(userId) {
        const snap = await this.db.collection(FOLDERS_COL(userId)).orderBy('name').get();
        return snap.docs.map((d) => d.data());
    }
}
exports.DocumentRegistry = DocumentRegistry;
//# sourceMappingURL=DocumentRegistry.js.map