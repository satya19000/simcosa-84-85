"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceScheduler = void 0;
const uuid_1 = require("uuid");
const FinanceEvents_1 = require("./FinanceEvents");
const SUGGESTIONS_COL = (userId) => `users/${userId}/financeSuggestions`;
// ── Finance Scheduler ────────────────────────────────────────────────────────
// Generates suggestions only — invoice/payment reminders, budget alerts,
// vendor follow-ups, approval requests. NEVER executes/sends anything; every
// suggestion requires explicit approval before any downstream action.
class FinanceScheduler {
    constructor(db, invoices, budgets, vendors, expenses, procurement, invoiceReminderLeadDays, vendorFollowUpDays) {
        this.db = db;
        this.invoices = invoices;
        this.budgets = budgets;
        this.vendors = vendors;
        this.expenses = expenses;
        this.procurement = procurement;
        this.invoiceReminderLeadDays = invoiceReminderLeadDays;
        this.vendorFollowUpDays = vendorFollowUpDays;
    }
    async createSuggestion(userId, scopeId, type, title, description) {
        const suggestion = {
            id: (0, uuid_1.v4)(),
            scopeId,
            type,
            title,
            description,
            requiresApproval: true,
            createdAt: new Date().toISOString(),
        };
        await this.db.collection(SUGGESTIONS_COL(userId)).doc(suggestion.id).set(suggestion);
        void FinanceEvents_1.FinanceEvents.emit('reminder:suggested', userId, { suggestionId: suggestion.id, type, scopeId });
        return suggestion;
    }
    async generateInvoiceReminders(userId) {
        const invoices = await this.invoices.listInvoices(userId, { status: 'sent' });
        const now = Date.now();
        const leadMs = this.invoiceReminderLeadDays * 24 * 60 * 60 * 1000;
        const suggestions = [];
        for (const inv of invoices) {
            const due = Date.parse(inv.dueDate);
            if (due - now <= leadMs && due - now > 0) {
                suggestions.push(await this.createSuggestion(userId, inv.id, 'invoice_reminder', 'Invoice Due Soon', `Invoice ${inv.invoiceNumber} is due on ${inv.dueDate}.`));
            }
        }
        return suggestions;
    }
    async generatePaymentReminders(userId) {
        const overdue = await this.invoices.detectOverdueInvoices(userId);
        const suggestions = [];
        for (const inv of overdue) {
            suggestions.push(await this.createSuggestion(userId, inv.id, 'payment_reminder', 'Invoice Overdue', `Invoice ${inv.invoiceNumber} is overdue (was due ${inv.dueDate}).`));
        }
        return suggestions;
    }
    async generateBudgetAlerts(userId) {
        const budgets = await this.budgets.listBudgets(userId, { status: 'active' });
        const overBudgets = await this.budgets.listBudgets(userId, { status: 'over_budget' });
        const suggestions = [];
        for (const b of [...budgets, ...overBudgets]) {
            const threshold = b.alertThresholdPct ?? 90;
            if (b.amount > 0 && (b.spent / b.amount) * 100 >= threshold) {
                suggestions.push(await this.createSuggestion(userId, b.id, 'budget_alert', 'Budget Nearing/Over Limit', `Budget "${b.name}" has used ${Math.round((b.spent / b.amount) * 100)}% of its allocation.`));
            }
        }
        return suggestions;
    }
    async generateVendorFollowUps(userId) {
        const vendors = await this.vendors.listVendors(userId, { status: 'active' });
        const now = Date.now();
        const windowMs = this.vendorFollowUpDays * 24 * 60 * 60 * 1000;
        const suggestions = [];
        for (const v of vendors) {
            const lastTouch = Date.parse(v.updatedAt);
            if (now - lastTouch >= windowMs) {
                suggestions.push(await this.createSuggestion(userId, v.id, 'vendor_follow_up', 'Vendor Follow-up Recommended', `Vendor "${v.name}" has had no activity/evaluation in over ${this.vendorFollowUpDays} days.`));
            }
        }
        return suggestions;
    }
    async generateApprovalRequests(userId) {
        const [pendingExpenses, requestedProcurement] = await Promise.all([
            this.expenses.listExpenses(userId, { approvalStatus: 'pending' }),
            this.procurement.listRequests(userId, { status: 'requested' }),
        ]);
        const suggestions = [];
        for (const e of pendingExpenses) {
            suggestions.push(await this.createSuggestion(userId, e.id, 'approval_request', 'Expense Awaiting Approval', `Expense "${e.description}" (${e.currency} ${e.amount}) is pending approval.`));
        }
        for (const p of requestedProcurement) {
            suggestions.push(await this.createSuggestion(userId, p.id, 'approval_request', 'Procurement Request Awaiting Approval', `Procurement request "${p.title}" is pending approval.`));
        }
        return suggestions;
    }
    async listPendingSuggestions(userId) {
        const snap = await this.db.collection(SUGGESTIONS_COL(userId)).orderBy('createdAt', 'desc').limit(100).get();
        return snap.docs.map((d) => d.data());
    }
    async dismissSuggestion(userId, suggestionId) {
        await this.db.collection(SUGGESTIONS_COL(userId)).doc(suggestionId).delete();
    }
    async runAllChecks(userId) {
        const results = await Promise.all([
            this.generateInvoiceReminders(userId),
            this.generatePaymentReminders(userId),
            this.generateBudgetAlerts(userId),
            this.generateVendorFollowUps(userId),
            this.generateApprovalRequests(userId),
        ]);
        return results.flat();
    }
}
exports.FinanceScheduler = FinanceScheduler;
//# sourceMappingURL=FinanceScheduler.js.map