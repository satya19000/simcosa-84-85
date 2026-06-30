"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceEngine = void 0;
const FinanceRegistry_1 = require("./FinanceRegistry");
const BudgetManager_1 = require("./BudgetManager");
const ExpenseManager_1 = require("./ExpenseManager");
const IncomeManager_1 = require("./IncomeManager");
const VendorManager_1 = require("./VendorManager");
const InvoiceManager_1 = require("./InvoiceManager");
const PaymentManager_1 = require("./PaymentManager");
const ProcurementManager_1 = require("./ProcurementManager");
const AssetManager_1 = require("./AssetManager");
const FinanceAnalytics_1 = require("./FinanceAnalytics");
const FinanceScheduler_1 = require("./FinanceScheduler");
const FinanceEvents_1 = require("./FinanceEvents");
const memory_graph_1 = require("../memory-graph");
class FinanceEngine {
    constructor(db, config, apiKey) {
        this.db = db;
        this.apiKey = apiKey;
        this.registry = new FinanceRegistry_1.FinanceRegistry();
        this.budgets = new BudgetManager_1.BudgetManager(db);
        this.expenses = new ExpenseManager_1.ExpenseManager(db);
        this.income = new IncomeManager_1.IncomeManager(db);
        this.vendors = new VendorManager_1.VendorManager(db);
        this.invoices = new InvoiceManager_1.InvoiceManager(db);
        this.payments = new PaymentManager_1.PaymentManager(db);
        this.procurement = new ProcurementManager_1.ProcurementManager(db);
        this.assets = new AssetManager_1.AssetManager(db);
        this.analytics = new FinanceAnalytics_1.FinanceAnalytics(db);
        this.scheduler = new FinanceScheduler_1.FinanceScheduler(db, this.invoices, this.budgets, this.vendors, this.expenses, this.procurement, config.invoiceReminderLeadDays, config.maintenanceReminderLeadDays);
    }
    // ── Provider Management ───────────────────────────────────────────────────
    registerProvider(provider) {
        this.registry.registerProvider(provider);
    }
    listProviders() {
        return this.registry.listRegistered();
    }
    async healthCheckAll(userId) {
        return Promise.all(this.registry.listProviders().map((p) => p.healthCheck(userId)));
    }
    // ── Budgets ───────────────────────────────────────────────────────────────
    async createBudget(userId, fields) {
        const budget = await this.budgets.createBudget(userId, fields);
        void this.linkBudgetToMemory(userId, budget);
        return budget;
    }
    async getBudget(userId, budgetId) {
        return this.budgets.getBudget(userId, budgetId);
    }
    async listBudgets(userId, opts) {
        return this.budgets.listBudgets(userId, opts ?? {});
    }
    async remainingBudget(userId, budgetId) {
        return this.budgets.remainingBudget(userId, budgetId);
    }
    async forecastBudget(userId, budgetId) {
        return this.budgets.forecastBudget(userId, budgetId);
    }
    // ── Expenses ──────────────────────────────────────────────────────────────
    // Workflow: Expense -> Approval -> Budget Check -> Payment -> Audit Log.
    // Today this is implemented at the manager level: recordExpense emits
    // expense:recorded, approveExpense calls BudgetManager.recordSpend (which
    // emits budget:alert / budget:exceeded), and recordPayment marks linked
    // invoices paid. See README.md "Workflow Integration" for the full chain
    // and the Phase 5.0 recommendation to formalize this via the Workflow Engine.
    async recordExpense(userId, fields) {
        return this.expenses.recordExpense(userId, fields);
    }
    async getExpense(userId, expenseId) {
        return this.expenses.getExpense(userId, expenseId);
    }
    async listExpenses(userId, opts) {
        return this.expenses.listExpenses(userId, opts ?? {});
    }
    async approveExpense(userId, expenseId, approvedBy) {
        return this.expenses.approveExpense(userId, expenseId, approvedBy);
    }
    async rejectExpense(userId, expenseId, rejectedBy) {
        return this.expenses.rejectExpense(userId, expenseId, rejectedBy);
    }
    async markExpenseReimbursed(userId, expenseId) {
        return this.expenses.markReimbursed(userId, expenseId);
    }
    // ── Income ────────────────────────────────────────────────────────────────
    async recordIncome(userId, fields) {
        return this.income.recordIncome(userId, fields);
    }
    async listIncome(userId, opts) {
        return this.income.listIncome(userId, opts ?? {});
    }
    // ── Vendors ───────────────────────────────────────────────────────────────
    async createVendor(userId, fields) {
        const vendor = await this.vendors.createVendor(userId, fields);
        void this.linkVendorToMemory(userId, vendor);
        return vendor;
    }
    async getVendor(userId, vendorId) {
        return this.vendors.getVendor(userId, vendorId);
    }
    async listVendors(userId, opts) {
        return this.vendors.listVendors(userId, opts ?? {});
    }
    async searchVendors(userId, term) {
        return this.vendors.searchVendors(userId, term);
    }
    async evaluateVendor(userId, vendorId, rating, note) {
        return this.vendors.evaluateVendor(userId, vendorId, rating, note);
    }
    // ── Invoices ──────────────────────────────────────────────────────────────
    async createInvoice(userId, fields) {
        const invoice = await this.invoices.createInvoice(userId, fields);
        void this.linkInvoiceToMemory(userId, invoice);
        return invoice;
    }
    async getInvoice(userId, invoiceId) {
        return this.invoices.getInvoice(userId, invoiceId);
    }
    async listInvoices(userId, opts) {
        return this.invoices.listInvoices(userId, opts ?? {});
    }
    async markInvoicePaid(userId, invoiceId) {
        return this.invoices.markPaid(userId, invoiceId);
    }
    async detectOverdueInvoices(userId) {
        return this.invoices.detectOverdueInvoices(userId);
    }
    // ── Payments ──────────────────────────────────────────────────────────────
    async recordPayment(userId, fields) {
        const payment = await this.payments.recordPayment(userId, fields);
        void this.linkPaymentToMemory(userId, payment);
        return payment;
    }
    async getPayment(userId, paymentId) {
        return this.payments.getPayment(userId, paymentId);
    }
    async listPayments(userId, opts) {
        return this.payments.listPayments(userId, opts ?? {});
    }
    // ── Procurement ───────────────────────────────────────────────────────────
    async createProcurementRequest(userId, fields) {
        const request = await this.procurement.createRequest(userId, fields);
        void this.linkProcurementToMemory(userId, request);
        return request;
    }
    async getProcurementRequest(userId, requestId) {
        return this.procurement.getRequest(userId, requestId);
    }
    async listProcurementRequests(userId, opts) {
        return this.procurement.listRequests(userId, opts ?? {});
    }
    async addQuotation(userId, requestId, quotation) {
        return this.procurement.addQuotation(userId, requestId, quotation);
    }
    async compareQuotations(userId, requestId) {
        return this.procurement.compareQuotations(userId, requestId);
    }
    async selectVendorForRequest(userId, requestId, vendorId) {
        return this.procurement.selectVendor(userId, requestId, vendorId);
    }
    async issuePurchaseOrder(userId, requestId, purchaseOrderNumber) {
        return this.procurement.issuePurchaseOrder(userId, requestId, purchaseOrderNumber);
    }
    async recordGoodsReceipt(userId, requestId) {
        return this.procurement.recordGoodsReceipt(userId, requestId);
    }
    async matchInvoiceToRequest(userId, requestId, invoiceId) {
        return this.procurement.matchInvoice(userId, requestId, invoiceId);
    }
    async approveProcurementRequest(userId, requestId, approvedBy) {
        return this.procurement.approveRequest(userId, requestId, approvedBy);
    }
    async rejectProcurementRequest(userId, requestId, rejectedBy) {
        return this.procurement.rejectRequest(userId, requestId, rejectedBy);
    }
    // ── Assets ────────────────────────────────────────────────────────────────
    async registerAsset(userId, fields) {
        return this.assets.registerAsset(userId, fields);
    }
    async getAsset(userId, assetId) {
        return this.assets.getAsset(userId, assetId);
    }
    async listAssets(userId, opts) {
        return this.assets.listAssets(userId, opts ?? {});
    }
    async assignAsset(userId, assetId, assignedTo) {
        return this.assets.assignAsset(userId, assetId, assignedTo);
    }
    async returnAsset(userId, assetId) {
        return this.assets.returnAsset(userId, assetId);
    }
    async scheduleAssetMaintenance(userId, assetId, date) {
        return this.assets.scheduleMaintenance(userId, assetId, date);
    }
    async checkMaintenanceDue(userId) {
        return this.assets.checkMaintenanceDue(userId);
    }
    async disposeAsset(userId, assetId, notes) {
        return this.assets.disposeAsset(userId, assetId, notes);
    }
    // ── Analytics ─────────────────────────────────────────────────────────────
    async getStats(userId) {
        return this.analytics.getStats(userId);
    }
    async getMonthlyReport(userId, year, month) {
        return this.analytics.getMonthlyReport(userId, year, month);
    }
    async getYearlyReport(userId, year) {
        return this.analytics.getYearlyReport(userId, year);
    }
    // ── Suggestions / Scheduler ───────────────────────────────────────────────
    async runReminderChecks(userId) {
        return this.scheduler.runAllChecks(userId);
    }
    async listPendingSuggestions(userId) {
        return this.scheduler.listPendingSuggestions(userId);
    }
    async dismissSuggestion(userId, suggestionId) {
        return this.scheduler.dismissSuggestion(userId, suggestionId);
    }
    // ── Document Intelligence Integration ────────────────────────────────────
    // Invoices flow: OCR (DocumentParser) -> Entity Extraction -> this method
    // creates/updates the Invoice record and returns a suggested Expense shape.
    // It never writes the Expense itself — actual Expense creation happens via
    // explicit approval through ActionEngine elsewhere in the system.
    async linkInvoiceDocument(userId, documentId, extractedFields) {
        const invoice = await this.invoices.createInvoice(userId, {
            vendorId: extractedFields.vendorId,
            invoiceNumber: extractedFields.invoiceNumber,
            lineItems: extractedFields.lineItems ?? [],
            totalAmount: extractedFields.totalAmount,
            currency: extractedFields.currency,
            issuedAt: extractedFields.issuedAt,
            dueDate: extractedFields.dueDate,
            documentId,
        });
        void FinanceEvents_1.FinanceEvents.emit('invoice:ingested', userId, { invoiceId: invoice.id, documentId });
        void this.linkInvoiceToMemory(userId, invoice);
        const suggestedExpense = {
            vendorId: extractedFields.vendorId,
            category: 'other',
            description: `Invoice ${extractedFields.invoiceNumber}`,
            amount: extractedFields.totalAmount,
            currency: extractedFields.currency,
            paymentMethod: 'bank_transfer',
            attachments: [{ id: documentId, documentId, filename: `invoice-${extractedFields.invoiceNumber}` }],
            incurredAt: extractedFields.issuedAt,
        };
        return { invoice, suggestedExpense };
    }
    // ── Memory Graph Integration ──────────────────────────────────────────────
    // Vendor -> Invoice -> Payment, Budget/Procurement linked best-effort.
    async linkBudgetToMemory(userId, budget) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            const { node } = await graph.upsertNode('project', budget.name, `${budget.period} budget: ${budget.amount}`, { budgetId: budget.id }, 30);
            await this.budgets.setMemoryNodeId(userId, budget.id, node.id);
        }
        catch {
            // best-effort
        }
    }
    async linkVendorToMemory(userId, vendor) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            const { node } = await graph.upsertNode('organization', vendor.name, `Vendor (${vendor.status})`, { vendorId: vendor.id }, 40);
            await this.vendors.setMemoryNodeId(userId, vendor.id, node.id);
        }
        catch {
            // best-effort
        }
    }
    async linkInvoiceToMemory(userId, invoice) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            const vendor = invoice.vendorId ? await this.vendors.getVendor(userId, invoice.vendorId) : null;
            const { node: invoiceNode } = await graph.upsertNode('expense', `Invoice ${invoice.invoiceNumber}`, `${invoice.currency} ${invoice.totalAmount}, due ${invoice.dueDate}`, { invoiceId: invoice.id, status: invoice.status }, 30);
            await this.invoices.setMemoryNodeId(userId, invoice.id, invoiceNode.id);
            if (vendor?.memoryNodeId) {
                await graph.upsertEdge(vendor.memoryNodeId, invoiceNode.id, 'RELATED_TO', { weight: 0.6, confidence: 0.8 });
            }
        }
        catch {
            // best-effort
        }
    }
    async linkPaymentToMemory(userId, payment) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            const invoice = payment.invoiceId ? await this.invoices.getInvoice(userId, payment.invoiceId) : null;
            const { node: paymentNode } = await graph.upsertNode('expense', `Payment ${payment.id}`, `${payment.currency} ${payment.amount} via ${payment.method}`, { paymentId: payment.id, status: payment.status }, 25);
            await this.payments.setMemoryNodeId(userId, payment.id, paymentNode.id);
            if (invoice?.memoryNodeId) {
                await graph.upsertEdge(invoice.memoryNodeId, paymentNode.id, 'RELATED_TO', { weight: 0.7, confidence: 0.85 });
            }
        }
        catch {
            // best-effort
        }
    }
    async linkProcurementToMemory(userId, request) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            const { node } = await graph.upsertNode('task', request.title, request.description, { procurementRequestId: request.id, status: request.status }, 25);
            await this.procurement.setMemoryNodeId(userId, request.id, node.id);
        }
        catch {
            // best-effort
        }
    }
}
exports.FinanceEngine = FinanceEngine;
//# sourceMappingURL=FinanceEngine.js.map