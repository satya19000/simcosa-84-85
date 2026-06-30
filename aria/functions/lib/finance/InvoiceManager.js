"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceManager = void 0;
const uuid_1 = require("uuid");
const FinanceEvents_1 = require("./FinanceEvents");
const COL = (userId) => `users/${userId}/invoices`;
class InvoiceManager {
    constructor(db) {
        this.db = db;
    }
    async createInvoice(userId, fields) {
        const now = new Date().toISOString();
        const invoice = { id: (0, uuid_1.v4)(), userId, status: 'draft', ...fields, createdAt: now, updatedAt: now };
        await this.db.collection(COL(userId)).doc(invoice.id).set(invoice);
        void FinanceEvents_1.FinanceEvents.emit('invoice:created', userId, { invoiceId: invoice.id });
        return invoice;
    }
    async getInvoice(userId, invoiceId) {
        const snap = await this.db.collection(COL(userId)).doc(invoiceId).get();
        return snap.exists ? snap.data() : null;
    }
    async updateInvoice(userId, invoiceId, patch) {
        await this.db.collection(COL(userId)).doc(invoiceId).update({ ...patch, updatedAt: new Date().toISOString() });
    }
    async listInvoices(userId, opts = {}) {
        let query = this.db.collection(COL(userId));
        if (opts.status)
            query = query.where('status', '==', opts.status);
        if (opts.vendorId)
            query = query.where('vendorId', '==', opts.vendorId);
        const snap = await query.orderBy('dueDate', 'desc').get();
        return snap.docs.map((d) => d.data());
    }
    async setMemoryNodeId(userId, invoiceId, memoryNodeId) {
        await this.db.collection(COL(userId)).doc(invoiceId).update({ memoryNodeId });
    }
    async markPaid(userId, invoiceId) {
        const invoice = await this.getInvoice(userId, invoiceId);
        if (!invoice)
            return null;
        const patch = { status: 'paid', paidAt: new Date().toISOString() };
        await this.updateInvoice(userId, invoiceId, patch);
        void FinanceEvents_1.FinanceEvents.emit('invoice:paid', userId, { invoiceId });
        return { ...invoice, ...patch, updatedAt: new Date().toISOString() };
    }
    /** Scans for invoices past due that aren't paid/cancelled; flips status and emits alerts. */
    async detectOverdueInvoices(userId) {
        const snap = await this.db.collection(COL(userId)).where('status', 'in', ['sent', 'approved']).get();
        const now = Date.now();
        const overdue = [];
        for (const doc of snap.docs) {
            const invoice = doc.data();
            if (Date.parse(invoice.dueDate) < now) {
                await this.updateInvoice(userId, invoice.id, { status: 'overdue' });
                void FinanceEvents_1.FinanceEvents.emit('invoice:overdue', userId, { invoiceId: invoice.id });
                overdue.push({ ...invoice, status: 'overdue' });
            }
        }
        return overdue;
    }
}
exports.InvoiceManager = InvoiceManager;
//# sourceMappingURL=InvoiceManager.js.map