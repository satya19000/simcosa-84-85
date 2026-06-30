"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomeManager = void 0;
const uuid_1 = require("uuid");
const FinanceEvents_1 = require("./FinanceEvents");
const COL = (userId) => `users/${userId}/income`;
class IncomeManager {
    constructor(db) {
        this.db = db;
    }
    async recordIncome(userId, fields) {
        const now = new Date().toISOString();
        const income = { id: (0, uuid_1.v4)(), userId, ...fields, createdAt: now, updatedAt: now };
        await this.db.collection(COL(userId)).doc(income.id).set(income);
        void FinanceEvents_1.FinanceEvents.emit('income:recorded', userId, { incomeId: income.id });
        return income;
    }
    async getIncome(userId, incomeId) {
        const snap = await this.db.collection(COL(userId)).doc(incomeId).get();
        return snap.exists ? snap.data() : null;
    }
    async updateIncome(userId, incomeId, patch) {
        await this.db.collection(COL(userId)).doc(incomeId).update({ ...patch, updatedAt: new Date().toISOString() });
    }
    async listIncome(userId, opts = {}) {
        let query = this.db.collection(COL(userId));
        if (opts.category)
            query = query.where('category', '==', opts.category);
        if (opts.fundingSourceId)
            query = query.where('fundingSourceId', '==', opts.fundingSourceId);
        const snap = await query.orderBy('receivedAt', 'desc').get();
        return snap.docs.map((d) => d.data());
    }
}
exports.IncomeManager = IncomeManager;
//# sourceMappingURL=IncomeManager.js.map