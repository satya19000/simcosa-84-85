"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceAnalytics = void 0;
const BudgetManager_1 = require("./BudgetManager");
const ExpenseManager_1 = require("./ExpenseManager");
const IncomeManager_1 = require("./IncomeManager");
const InvoiceManager_1 = require("./InvoiceManager");
const PaymentManager_1 = require("./PaymentManager");
const AssetManager_1 = require("./AssetManager");
const VendorManager_1 = require("./VendorManager");
const ProcurementManager_1 = require("./ProcurementManager");
class FinanceAnalytics {
    constructor(db) {
        this.budgets = new BudgetManager_1.BudgetManager(db);
        this.expenses = new ExpenseManager_1.ExpenseManager(db);
        this.income = new IncomeManager_1.IncomeManager(db);
        this.invoices = new InvoiceManager_1.InvoiceManager(db);
        this.payments = new PaymentManager_1.PaymentManager(db);
        this.assets = new AssetManager_1.AssetManager(db);
        this.vendors = new VendorManager_1.VendorManager(db);
        this.procurement = new ProcurementManager_1.ProcurementManager(db);
    }
    async getStats(userId) {
        const [budgets, expenses, income, invoices, payments, assets, vendors, procurementRequests] = await Promise.all([
            this.budgets.listBudgets(userId),
            this.expenses.listExpenses(userId),
            this.income.listIncome(userId),
            this.invoices.listInvoices(userId),
            this.payments.listPayments(userId),
            this.assets.listAssets(userId),
            this.vendors.listVendors(userId),
            this.procurement.listRequests(userId),
        ]);
        void payments;
        const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const cashFlow = totalIncome - totalExpenses;
        const activeBudgets = budgets.filter((b) => b.status === 'active' || b.status === 'over_budget');
        const budgetUtilizationRate = activeBudgets.length > 0
            ? activeBudgets.reduce((sum, b) => sum + (b.amount > 0 ? b.spent / b.amount : 0), 0) / activeBudgets.length
            : 0;
        const pendingInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'approved').length;
        const overdueInvoices = invoices.filter((i) => i.status === 'overdue').length;
        const pendingApprovals = expenses.filter((e) => e.approvalStatus === 'pending').length +
            procurementRequests.filter((p) => p.status === 'requested').length;
        const byExpenseCategory = {};
        for (const e of expenses) {
            byExpenseCategory[e.category] = (byExpenseCategory[e.category] ?? 0) + e.amount;
        }
        return {
            totalIncome,
            totalExpenses,
            cashFlow,
            totalBudgets: budgets.length,
            budgetUtilizationRate,
            pendingInvoices,
            overdueInvoices,
            pendingApprovals,
            assetsCount: assets.length,
            vendorsCount: vendors.length,
            byExpenseCategory,
        };
    }
    async getMonthlyReport(userId, year, month) {
        const start = new Date(Date.UTC(year, month - 1, 1)).getTime();
        const end = new Date(Date.UTC(year, month, 1)).getTime();
        return this.getPeriodReport(userId, start, end, { year, month });
    }
    async getYearlyReport(userId, year) {
        const start = new Date(Date.UTC(year, 0, 1)).getTime();
        const end = new Date(Date.UTC(year + 1, 0, 1)).getTime();
        return this.getPeriodReport(userId, start, end, { year });
    }
    async getPeriodReport(userId, start, end, extra) {
        const [allExpenses, allIncome] = await Promise.all([
            this.expenses.listExpenses(userId),
            this.income.listIncome(userId),
        ]);
        const periodExpenses = allExpenses.filter((e) => {
            const t = Date.parse(e.incurredAt);
            return t >= start && t < end;
        });
        const periodIncome = allIncome.filter((i) => {
            const t = Date.parse(i.receivedAt);
            return t >= start && t < end;
        });
        const income = periodIncome.reduce((sum, i) => sum + i.amount, 0);
        const expenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
        const byCategory = {};
        for (const e of periodExpenses) {
            byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
        }
        return { ...extra, income, expenses, cashFlow: income - expenses, byCategory };
    }
}
exports.FinanceAnalytics = FinanceAnalytics;
//# sourceMappingURL=FinanceAnalytics.js.map