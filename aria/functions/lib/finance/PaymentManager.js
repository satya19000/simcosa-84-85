"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentManager = void 0;
const uuid_1 = require("uuid");
const FinanceEvents_1 = require("./FinanceEvents");
const InvoiceManager_1 = require("./InvoiceManager");
const COL = (userId) => `users/${userId}/payments`;
class PaymentManager {
    constructor(db) {
        this.db = db;
        this.invoices = new InvoiceManager_1.InvoiceManager(db);
    }
    async recordPayment(userId, fields) {
        const now = new Date().toISOString();
        const payment = { id: (0, uuid_1.v4)(), userId, status: 'completed', ...fields, createdAt: now, updatedAt: now };
        await this.db.collection(COL(userId)).doc(payment.id).set(payment);
        if (payment.status === 'completed' && payment.invoiceId) {
            await this.invoices.markPaid(userId, payment.invoiceId);
        }
        if (payment.status === 'failed') {
            void FinanceEvents_1.FinanceEvents.emit('payment:failed', userId, { paymentId: payment.id });
        }
        else {
            void FinanceEvents_1.FinanceEvents.emit('payment:recorded', userId, { paymentId: payment.id });
        }
        return payment;
    }
    async getPayment(userId, paymentId) {
        const snap = await this.db.collection(COL(userId)).doc(paymentId).get();
        return snap.exists ? snap.data() : null;
    }
    async updatePayment(userId, paymentId, patch) {
        await this.db.collection(COL(userId)).doc(paymentId).update({ ...patch, updatedAt: new Date().toISOString() });
    }
    async listPayments(userId, opts = {}) {
        let query = this.db.collection(COL(userId));
        if (opts.status)
            query = query.where('status', '==', opts.status);
        if (opts.invoiceId)
            query = query.where('invoiceId', '==', opts.invoiceId);
        if (opts.expenseId)
            query = query.where('expenseId', '==', opts.expenseId);
        const snap = await query.orderBy('paidAt', 'desc').get();
        return snap.docs.map((d) => d.data());
    }
    async setMemoryNodeId(userId, paymentId, memoryNodeId) {
        await this.db.collection(COL(userId)).doc(paymentId).update({ memoryNodeId });
    }
}
exports.PaymentManager = PaymentManager;
//# sourceMappingURL=PaymentManager.js.map