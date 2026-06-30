"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetManager = void 0;
const uuid_1 = require("uuid");
const FinanceEvents_1 = require("./FinanceEvents");
const COL = (userId) => `users/${userId}/assets`;
class AssetManager {
    constructor(db) {
        this.db = db;
    }
    async registerAsset(userId, fields) {
        const now = new Date().toISOString();
        const asset = {
            id: (0, uuid_1.v4)(),
            userId,
            status: 'active',
            assignmentHistory: [],
            ...fields,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(COL(userId)).doc(asset.id).set(asset);
        void FinanceEvents_1.FinanceEvents.emit('asset:registered', userId, { assetId: asset.id });
        return asset;
    }
    async getAsset(userId, assetId) {
        const snap = await this.db.collection(COL(userId)).doc(assetId).get();
        return snap.exists ? snap.data() : null;
    }
    async updateAsset(userId, assetId, patch) {
        await this.db.collection(COL(userId)).doc(assetId).update({ ...patch, updatedAt: new Date().toISOString() });
    }
    async listAssets(userId, opts = {}) {
        let query = this.db.collection(COL(userId));
        if (opts.status)
            query = query.where('status', '==', opts.status);
        if (opts.category)
            query = query.where('category', '==', opts.category);
        const snap = await query.orderBy('purchaseDate', 'desc').get();
        return snap.docs.map((d) => d.data());
    }
    async setMemoryNodeId(userId, assetId, memoryNodeId) {
        await this.db.collection(COL(userId)).doc(assetId).update({ memoryNodeId });
    }
    async assignAsset(userId, assetId, assignedTo) {
        const asset = await this.getAsset(userId, assetId);
        if (!asset)
            return null;
        const entry = { id: (0, uuid_1.v4)(), assignedTo, assignedAt: new Date().toISOString() };
        const assignmentHistory = [...asset.assignmentHistory, entry];
        await this.updateAsset(userId, assetId, { assignmentHistory });
        return { ...asset, assignmentHistory, updatedAt: new Date().toISOString() };
    }
    async returnAsset(userId, assetId) {
        const asset = await this.getAsset(userId, assetId);
        if (!asset)
            return null;
        const assignmentHistory = [...asset.assignmentHistory];
        for (let i = assignmentHistory.length - 1; i >= 0; i--) {
            if (!assignmentHistory[i].returnedAt) {
                assignmentHistory[i] = { ...assignmentHistory[i], returnedAt: new Date().toISOString() };
                break;
            }
        }
        await this.updateAsset(userId, assetId, { assignmentHistory });
        return { ...asset, assignmentHistory, updatedAt: new Date().toISOString() };
    }
    async scheduleMaintenance(userId, assetId, date) {
        const asset = await this.getAsset(userId, assetId);
        if (!asset)
            return null;
        const patch = { nextMaintenanceAt: date };
        await this.updateAsset(userId, assetId, patch);
        return { ...asset, ...patch, updatedAt: new Date().toISOString() };
    }
    /** Scans for assets whose next maintenance date has arrived/passed; emits alerts. */
    async checkMaintenanceDue(userId) {
        const snap = await this.db.collection(COL(userId)).where('status', '==', 'active').get();
        const now = Date.now();
        const due = [];
        for (const doc of snap.docs) {
            const asset = doc.data();
            if (asset.nextMaintenanceAt && Date.parse(asset.nextMaintenanceAt) <= now) {
                void FinanceEvents_1.FinanceEvents.emit('asset:maintenance_due', userId, { assetId: asset.id });
                due.push(asset);
            }
        }
        return due;
    }
    async disposeAsset(userId, assetId, notes) {
        const asset = await this.getAsset(userId, assetId);
        if (!asset)
            return null;
        const patch = { status: 'disposed', disposedAt: new Date().toISOString(), disposalNotes: notes };
        await this.updateAsset(userId, assetId, patch);
        void FinanceEvents_1.FinanceEvents.emit('asset:disposed', userId, { assetId });
        return { ...asset, ...patch, updatedAt: new Date().toISOString() };
    }
    /**
     * Pluggable extension point: real depreciation methods (straight-line,
     * declining-balance, etc.) should be implemented by a plugin/program module.
     * This stub intentionally returns the purchase value unchanged.
     */
    computeDepreciationPlaceholder(asset) {
        return asset.purchaseValue;
    }
}
exports.AssetManager = AssetManager;
//# sourceMappingURL=AssetManager.js.map