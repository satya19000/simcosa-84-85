"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementManager = void 0;
const uuid_1 = require("uuid");
const FinanceEvents_1 = require("./FinanceEvents");
const COL = (userId) => `users/${userId}/procurementRequests`;
class ProcurementManager {
    constructor(db) {
        this.db = db;
    }
    async createRequest(userId, fields) {
        const now = new Date().toISOString();
        const request = {
            id: (0, uuid_1.v4)(),
            userId,
            status: 'requested',
            quotations: [],
            ...fields,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(COL(userId)).doc(request.id).set(request);
        void FinanceEvents_1.FinanceEvents.emit('procurement:requested', userId, { requestId: request.id });
        return request;
    }
    async getRequest(userId, requestId) {
        const snap = await this.db.collection(COL(userId)).doc(requestId).get();
        return snap.exists ? snap.data() : null;
    }
    async updateRequest(userId, requestId, patch) {
        await this.db.collection(COL(userId)).doc(requestId).update({ ...patch, updatedAt: new Date().toISOString() });
    }
    async listRequests(userId, opts = {}) {
        let query = this.db.collection(COL(userId));
        if (opts.status)
            query = query.where('status', '==', opts.status);
        const snap = await query.orderBy('createdAt', 'desc').get();
        return snap.docs.map((d) => d.data());
    }
    async setMemoryNodeId(userId, requestId, memoryNodeId) {
        await this.db.collection(COL(userId)).doc(requestId).update({ memoryNodeId });
    }
    async addQuotation(userId, requestId, quotation) {
        const request = await this.getRequest(userId, requestId);
        if (!request)
            return null;
        const newQuotation = { id: (0, uuid_1.v4)(), submittedAt: new Date().toISOString(), ...quotation };
        const quotations = [...request.quotations, newQuotation];
        const patch = {
            quotations,
            status: request.status === 'requested' || request.status === 'quotation_pending' ? 'quotation_received' : request.status,
        };
        await this.updateRequest(userId, requestId, patch);
        return { ...request, ...patch, updatedAt: new Date().toISOString() };
    }
    /** Returns quotations sorted ascending by amount (cheapest first). */
    async compareQuotations(userId, requestId) {
        const request = await this.getRequest(userId, requestId);
        if (!request)
            return [];
        return [...request.quotations].sort((a, b) => a.amount - b.amount);
    }
    async selectVendor(userId, requestId, vendorId) {
        const request = await this.getRequest(userId, requestId);
        if (!request)
            return null;
        const patch = { selectedVendorId: vendorId };
        await this.updateRequest(userId, requestId, patch);
        return { ...request, ...patch, updatedAt: new Date().toISOString() };
    }
    async issuePurchaseOrder(userId, requestId, purchaseOrderNumber) {
        const request = await this.getRequest(userId, requestId);
        if (!request)
            return null;
        const patch = { status: 'po_issued', purchaseOrderNumber };
        await this.updateRequest(userId, requestId, patch);
        void FinanceEvents_1.FinanceEvents.emit('procurement:po_issued', userId, { requestId, purchaseOrderNumber });
        return { ...request, ...patch, updatedAt: new Date().toISOString() };
    }
    async recordGoodsReceipt(userId, requestId) {
        const request = await this.getRequest(userId, requestId);
        if (!request)
            return null;
        const patch = { status: 'goods_received' };
        await this.updateRequest(userId, requestId, patch);
        return { ...request, ...patch, updatedAt: new Date().toISOString() };
    }
    async matchInvoice(userId, requestId, invoiceId) {
        const request = await this.getRequest(userId, requestId);
        if (!request)
            return null;
        const patch = { status: 'invoice_matched', invoiceId };
        await this.updateRequest(userId, requestId, patch);
        return { ...request, ...patch, updatedAt: new Date().toISOString() };
    }
    async approveRequest(userId, requestId, approvedBy) {
        const request = await this.getRequest(userId, requestId);
        if (!request)
            return null;
        const patch = { status: 'completed', approvedBy };
        await this.updateRequest(userId, requestId, patch);
        void FinanceEvents_1.FinanceEvents.emit('procurement:approved', userId, { requestId, approvedBy });
        return { ...request, ...patch, updatedAt: new Date().toISOString() };
    }
    async rejectRequest(userId, requestId, rejectedBy) {
        const request = await this.getRequest(userId, requestId);
        if (!request)
            return null;
        const patch = { status: 'rejected', approvedBy: rejectedBy };
        await this.updateRequest(userId, requestId, patch);
        return { ...request, ...patch, updatedAt: new Date().toISOString() };
    }
}
exports.ProcurementManager = ProcurementManager;
//# sourceMappingURL=ProcurementManager.js.map