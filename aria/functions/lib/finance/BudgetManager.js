"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetManager = void 0;
const uuid_1 = require("uuid");
const FinanceEvents_1 = require("./FinanceEvents");
const COL = (userId) => `users/${userId}/budgets`;
class BudgetManager {
    constructor(db) {
        this.db = db;
    }
    async createBudget(userId, fields) {
        const now = new Date().toISOString();
        const budget = {
            id: (0, uuid_1.v4)(),
            userId,
            status: 'active',
            spent: 0,
            ...fields,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(COL(userId)).doc(budget.id).set(budget);
        void FinanceEvents_1.FinanceEvents.emit('budget:created', userId, { budgetId: budget.id });
        return budget;
    }
    async getBudget(userId, budgetId) {
        const snap = await this.db.collection(COL(userId)).doc(budgetId).get();
        return snap.exists ? snap.data() : null;
    }
    async updateBudget(userId, budgetId, patch) {
        await this.db.collection(COL(userId)).doc(budgetId).update({
            ...patch,
            updatedAt: new Date().toISOString(),
        });
    }
    async listBudgets(userId, opts = {}) {
        let query = this.db.collection(COL(userId));
        if (opts.period)
            query = query.where('period', '==', opts.period);
        if (opts.status)
            query = query.where('status', '==', opts.status);
        const snap = await query.orderBy('startDate', 'desc').get();
        return snap.docs.map((d) => d.data());
    }
    async setMemoryNodeId(userId, budgetId, memoryNodeId) {
        await this.db.collection(COL(userId)).doc(budgetId).update({ memoryNodeId });
    }
    /** Increments spend, flips status/emits alerts when thresholds are crossed. */
    async recordSpend(userId, budgetId, amount) {
        const budget = await this.getBudget(userId, budgetId);
        if (!budget)
            return null;
        const spent = budget.spent + amount;
        const patch = { spent };
        const threshold = budget.alertThresholdPct ?? 90;
        if (spent >= budget.amount) {
            patch.status = 'over_budget';
            void FinanceEvents_1.FinanceEvents.emit('budget:exceeded', userId, { budgetId, spent, amount: budget.amount });
        }
        else if (budget.amount > 0 && (spent / budget.amount) * 100 >= threshold) {
            void FinanceEvents_1.FinanceEvents.emit('budget:alert', userId, { budgetId, spent, amount: budget.amount, threshold });
        }
        await this.updateBudget(userId, budgetId, patch);
        return { ...budget, ...patch, updatedAt: new Date().toISOString() };
    }
    async remainingBudget(userId, budgetId) {
        const budget = await this.getBudget(userId, budgetId);
        if (!budget)
            return null;
        return budget.amount - budget.spent;
    }
    /** Simple linear forecast based on elapsed-time vs spend ratio. */
    async forecastBudget(userId, budgetId) {
        const budget = await this.getBudget(userId, budgetId);
        if (!budget)
            return null;
        const start = Date.parse(budget.startDate);
        const end = Date.parse(budget.endDate);
        const now = Date.now();
        const elapsedFraction = end > start ? Math.min(1, Math.max(0, (now - start) / (end - start))) : 1;
        const projectedTotal = elapsedFraction > 0 ? budget.spent / elapsedFraction : budget.spent;
        return { projectedTotal, willExceed: projectedTotal > budget.amount };
    }
}
exports.BudgetManager = BudgetManager;
//# sourceMappingURL=BudgetManager.js.map