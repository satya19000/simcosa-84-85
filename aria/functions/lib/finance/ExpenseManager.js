"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseManager = void 0;
const uuid_1 = require("uuid");
const FinanceEvents_1 = require("./FinanceEvents");
const BudgetManager_1 = require("./BudgetManager");
const COL = (userId) => `users/${userId}/expenses`;
class ExpenseManager {
    constructor(db) {
        this.db = db;
        this.budgets = new BudgetManager_1.BudgetManager(db);
    }
    async recordExpense(userId, fields) {
        const now = new Date().toISOString();
        const expense = {
            id: (0, uuid_1.v4)(),
            userId,
            approvalStatus: 'pending',
            ...fields,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(COL(userId)).doc(expense.id).set(expense);
        void FinanceEvents_1.FinanceEvents.emit('expense:recorded', userId, { expenseId: expense.id });
        return expense;
    }
    async getExpense(userId, expenseId) {
        const snap = await this.db.collection(COL(userId)).doc(expenseId).get();
        return snap.exists ? snap.data() : null;
    }
    async updateExpense(userId, expenseId, patch) {
        await this.db.collection(COL(userId)).doc(expenseId).update({
            ...patch,
            updatedAt: new Date().toISOString(),
        });
    }
    async listExpenses(userId, opts = {}) {
        let query = this.db.collection(COL(userId));
        if (opts.category)
            query = query.where('category', '==', opts.category);
        if (opts.approvalStatus)
            query = query.where('approvalStatus', '==', opts.approvalStatus);
        if (opts.budgetId)
            query = query.where('budgetId', '==', opts.budgetId);
        const snap = await query.orderBy('incurredAt', 'desc').get();
        return snap.docs.map((d) => d.data());
    }
    async setMemoryNodeId(userId, expenseId, memoryNodeId) {
        await this.db.collection(COL(userId)).doc(expenseId).update({ memoryNodeId });
    }
    /** Approves an expense, applies its amount against the linked budget (if any). */
    async approveExpense(userId, expenseId, approvedBy) {
        const expense = await this.getExpense(userId, expenseId);
        if (!expense)
            return null;
        const patch = { approvalStatus: 'approved', approvedBy };
        await this.updateExpense(userId, expenseId, patch);
        if (expense.budgetId) {
            await this.budgets.recordSpend(userId, expense.budgetId, expense.amount);
        }
        void FinanceEvents_1.FinanceEvents.emit('expense:approved', userId, { expenseId, approvedBy });
        return { ...expense, ...patch, updatedAt: new Date().toISOString() };
    }
    async rejectExpense(userId, expenseId, rejectedBy) {
        const expense = await this.getExpense(userId, expenseId);
        if (!expense)
            return null;
        const patch = { approvalStatus: 'rejected', approvedBy: rejectedBy };
        await this.updateExpense(userId, expenseId, patch);
        void FinanceEvents_1.FinanceEvents.emit('expense:rejected', userId, { expenseId, rejectedBy });
        return { ...expense, ...patch, updatedAt: new Date().toISOString() };
    }
    async markReimbursed(userId, expenseId) {
        await this.updateExpense(userId, expenseId, { approvalStatus: 'reimbursed' });
    }
    async listRecurringExpenses(userId) {
        const snap = await this.db.collection(COL(userId)).where('recurrence', '!=', 'none').get();
        return snap.docs.map((d) => d.data());
    }
}
exports.ExpenseManager = ExpenseManager;
//# sourceMappingURL=ExpenseManager.js.map