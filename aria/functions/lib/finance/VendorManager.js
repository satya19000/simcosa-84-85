"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorManager = void 0;
const uuid_1 = require("uuid");
const FinanceEvents_1 = require("./FinanceEvents");
const COL = (userId) => `users/${userId}/vendors`;
class VendorManager {
    constructor(db) {
        this.db = db;
    }
    async createVendor(userId, fields) {
        const now = new Date().toISOString();
        const vendor = { id: (0, uuid_1.v4)(), userId, status: 'active', ...fields, createdAt: now, updatedAt: now };
        await this.db.collection(COL(userId)).doc(vendor.id).set(vendor);
        void FinanceEvents_1.FinanceEvents.emit('vendor:created', userId, { vendorId: vendor.id });
        return vendor;
    }
    async getVendor(userId, vendorId) {
        const snap = await this.db.collection(COL(userId)).doc(vendorId).get();
        return snap.exists ? snap.data() : null;
    }
    async updateVendor(userId, vendorId, patch) {
        await this.db.collection(COL(userId)).doc(vendorId).update({ ...patch, updatedAt: new Date().toISOString() });
    }
    async listVendors(userId, opts = {}) {
        let query = this.db.collection(COL(userId));
        if (opts.status)
            query = query.where('status', '==', opts.status);
        const snap = await query.orderBy('name').get();
        return snap.docs.map((d) => d.data());
    }
    async searchVendors(userId, term) {
        const all = await this.listVendors(userId);
        const lower = term.toLowerCase();
        return all.filter((v) => v.name.toLowerCase().includes(lower));
    }
    async setMemoryNodeId(userId, vendorId, memoryNodeId) {
        await this.db.collection(COL(userId)).doc(vendorId).update({ memoryNodeId });
    }
    async evaluateVendor(userId, vendorId, rating, note) {
        const vendor = await this.getVendor(userId, vendorId);
        if (!vendor)
            return null;
        const evaluationNotes = note ? [...(vendor.evaluationNotes ?? []), note] : vendor.evaluationNotes;
        const patch = { rating, evaluationNotes };
        await this.updateVendor(userId, vendorId, patch);
        void FinanceEvents_1.FinanceEvents.emit('vendor:evaluated', userId, { vendorId, rating });
        return { ...vendor, ...patch, updatedAt: new Date().toISOString() };
    }
}
exports.VendorManager = VendorManager;
//# sourceMappingURL=VendorManager.js.map