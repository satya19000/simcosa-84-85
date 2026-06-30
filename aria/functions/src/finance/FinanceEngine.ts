import type * as admin from 'firebase-admin'
import type {
  Budget, BudgetPeriod, BudgetStatus,
  Expense, ExpenseApprovalStatus, ExpenseCategory,
  Income,
  Vendor, VendorStatus,
  Invoice, InvoiceStatus,
  Payment, PaymentStatus,
  ProcurementRequest, ProcurementStatus, Quotation,
  Asset, AssetStatus,
  FinanceStats, FinanceSuggestion,
} from './FinanceTypes'
import type { FinanceConfig } from './FinanceConfig'
import type { FinanceProvider } from './FinanceProvider'
import { FinanceRegistry } from './FinanceRegistry'
import { BudgetManager } from './BudgetManager'
import { ExpenseManager } from './ExpenseManager'
import { IncomeManager } from './IncomeManager'
import { VendorManager } from './VendorManager'
import { InvoiceManager } from './InvoiceManager'
import { PaymentManager } from './PaymentManager'
import { ProcurementManager } from './ProcurementManager'
import { AssetManager } from './AssetManager'
import { FinanceAnalytics } from './FinanceAnalytics'
import { FinanceScheduler } from './FinanceScheduler'
import { FinanceEvents } from './FinanceEvents'
import { getMemoryGraph } from '../memory-graph'

export class FinanceEngine {
  private readonly registry: FinanceRegistry
  private readonly budgets: BudgetManager
  private readonly expenses: ExpenseManager
  private readonly income: IncomeManager
  private readonly vendors: VendorManager
  private readonly invoices: InvoiceManager
  private readonly payments: PaymentManager
  private readonly procurement: ProcurementManager
  private readonly assets: AssetManager
  private readonly analytics: FinanceAnalytics
  private readonly scheduler: FinanceScheduler

  constructor(
    private readonly db: admin.firestore.Firestore,
    config: FinanceConfig,
    private readonly apiKey: string
  ) {
    this.registry = new FinanceRegistry()
    this.budgets = new BudgetManager(db)
    this.expenses = new ExpenseManager(db)
    this.income = new IncomeManager(db)
    this.vendors = new VendorManager(db)
    this.invoices = new InvoiceManager(db)
    this.payments = new PaymentManager(db)
    this.procurement = new ProcurementManager(db)
    this.assets = new AssetManager(db)
    this.analytics = new FinanceAnalytics(db)
    this.scheduler = new FinanceScheduler(
      db, this.invoices, this.budgets, this.vendors, this.expenses, this.procurement,
      config.invoiceReminderLeadDays, config.maintenanceReminderLeadDays
    )
  }

  // ── Provider Management ───────────────────────────────────────────────────

  registerProvider(provider: FinanceProvider): void {
    this.registry.registerProvider(provider)
  }

  listProviders(): Array<{ id: string; name: string; type: string }> {
    return this.registry.listRegistered()
  }

  async healthCheckAll(userId: string) {
    return Promise.all(this.registry.listProviders().map((p) => p.healthCheck(userId)))
  }

  // ── Budgets ───────────────────────────────────────────────────────────────

  async createBudget(userId: string, fields: Omit<Budget, 'id' | 'userId' | 'status' | 'spent' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    const budget = await this.budgets.createBudget(userId, fields)
    void this.linkBudgetToMemory(userId, budget)
    return budget
  }

  async getBudget(userId: string, budgetId: string): Promise<Budget | null> {
    return this.budgets.getBudget(userId, budgetId)
  }

  async listBudgets(userId: string, opts?: { period?: BudgetPeriod; status?: BudgetStatus }): Promise<Budget[]> {
    return this.budgets.listBudgets(userId, opts ?? {})
  }

  async remainingBudget(userId: string, budgetId: string): Promise<number | null> {
    return this.budgets.remainingBudget(userId, budgetId)
  }

  async forecastBudget(userId: string, budgetId: string) {
    return this.budgets.forecastBudget(userId, budgetId)
  }

  // ── Expenses ──────────────────────────────────────────────────────────────
  // Workflow: Expense -> Approval -> Budget Check -> Payment -> Audit Log.
  // Today this is implemented at the manager level: recordExpense emits
  // expense:recorded, approveExpense calls BudgetManager.recordSpend (which
  // emits budget:alert / budget:exceeded), and recordPayment marks linked
  // invoices paid. See README.md "Workflow Integration" for the full chain
  // and the Phase 5.0 recommendation to formalize this via the Workflow Engine.

  async recordExpense(userId: string, fields: Omit<Expense, 'id' | 'userId' | 'approvalStatus' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    return this.expenses.recordExpense(userId, fields)
  }

  async getExpense(userId: string, expenseId: string): Promise<Expense | null> {
    return this.expenses.getExpense(userId, expenseId)
  }

  async listExpenses(userId: string, opts?: { category?: ExpenseCategory; approvalStatus?: ExpenseApprovalStatus; budgetId?: string }): Promise<Expense[]> {
    return this.expenses.listExpenses(userId, opts ?? {})
  }

  async approveExpense(userId: string, expenseId: string, approvedBy: string): Promise<Expense | null> {
    return this.expenses.approveExpense(userId, expenseId, approvedBy)
  }

  async rejectExpense(userId: string, expenseId: string, rejectedBy: string): Promise<Expense | null> {
    return this.expenses.rejectExpense(userId, expenseId, rejectedBy)
  }

  async markExpenseReimbursed(userId: string, expenseId: string): Promise<void> {
    return this.expenses.markReimbursed(userId, expenseId)
  }

  // ── Income ────────────────────────────────────────────────────────────────

  async recordIncome(userId: string, fields: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Income> {
    return this.income.recordIncome(userId, fields)
  }

  async listIncome(userId: string, opts?: { category?: Income['category']; fundingSourceId?: string }): Promise<Income[]> {
    return this.income.listIncome(userId, opts ?? {})
  }

  // ── Vendors ───────────────────────────────────────────────────────────────

  async createVendor(userId: string, fields: Omit<Vendor, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Vendor> {
    const vendor = await this.vendors.createVendor(userId, fields)
    void this.linkVendorToMemory(userId, vendor)
    return vendor
  }

  async getVendor(userId: string, vendorId: string): Promise<Vendor | null> {
    return this.vendors.getVendor(userId, vendorId)
  }

  async listVendors(userId: string, opts?: { status?: VendorStatus }): Promise<Vendor[]> {
    return this.vendors.listVendors(userId, opts ?? {})
  }

  async searchVendors(userId: string, term: string): Promise<Vendor[]> {
    return this.vendors.searchVendors(userId, term)
  }

  async evaluateVendor(userId: string, vendorId: string, rating: number, note?: string): Promise<Vendor | null> {
    return this.vendors.evaluateVendor(userId, vendorId, rating, note)
  }

  // ── Invoices ──────────────────────────────────────────────────────────────

  async createInvoice(userId: string, fields: Omit<Invoice, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const invoice = await this.invoices.createInvoice(userId, fields)
    void this.linkInvoiceToMemory(userId, invoice)
    return invoice
  }

  async getInvoice(userId: string, invoiceId: string): Promise<Invoice | null> {
    return this.invoices.getInvoice(userId, invoiceId)
  }

  async listInvoices(userId: string, opts?: { status?: InvoiceStatus; vendorId?: string }): Promise<Invoice[]> {
    return this.invoices.listInvoices(userId, opts ?? {})
  }

  async markInvoicePaid(userId: string, invoiceId: string): Promise<Invoice | null> {
    return this.invoices.markPaid(userId, invoiceId)
  }

  async detectOverdueInvoices(userId: string): Promise<Invoice[]> {
    return this.invoices.detectOverdueInvoices(userId)
  }

  // ── Payments ──────────────────────────────────────────────────────────────

  async recordPayment(userId: string, fields: Omit<Payment, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
    const payment = await this.payments.recordPayment(userId, fields)
    void this.linkPaymentToMemory(userId, payment)
    return payment
  }

  async getPayment(userId: string, paymentId: string): Promise<Payment | null> {
    return this.payments.getPayment(userId, paymentId)
  }

  async listPayments(userId: string, opts?: { status?: PaymentStatus; invoiceId?: string; expenseId?: string }): Promise<Payment[]> {
    return this.payments.listPayments(userId, opts ?? {})
  }

  // ── Procurement ───────────────────────────────────────────────────────────

  async createProcurementRequest(userId: string, fields: Omit<ProcurementRequest, 'id' | 'userId' | 'status' | 'quotations' | 'createdAt' | 'updatedAt'>): Promise<ProcurementRequest> {
    const request = await this.procurement.createRequest(userId, fields)
    void this.linkProcurementToMemory(userId, request)
    return request
  }

  async getProcurementRequest(userId: string, requestId: string): Promise<ProcurementRequest | null> {
    return this.procurement.getRequest(userId, requestId)
  }

  async listProcurementRequests(userId: string, opts?: { status?: ProcurementStatus }): Promise<ProcurementRequest[]> {
    return this.procurement.listRequests(userId, opts ?? {})
  }

  async addQuotation(userId: string, requestId: string, quotation: Omit<Quotation, 'id' | 'submittedAt'>): Promise<ProcurementRequest | null> {
    return this.procurement.addQuotation(userId, requestId, quotation)
  }

  async compareQuotations(userId: string, requestId: string): Promise<Quotation[]> {
    return this.procurement.compareQuotations(userId, requestId)
  }

  async selectVendorForRequest(userId: string, requestId: string, vendorId: string): Promise<ProcurementRequest | null> {
    return this.procurement.selectVendor(userId, requestId, vendorId)
  }

  async issuePurchaseOrder(userId: string, requestId: string, purchaseOrderNumber: string): Promise<ProcurementRequest | null> {
    return this.procurement.issuePurchaseOrder(userId, requestId, purchaseOrderNumber)
  }

  async recordGoodsReceipt(userId: string, requestId: string): Promise<ProcurementRequest | null> {
    return this.procurement.recordGoodsReceipt(userId, requestId)
  }

  async matchInvoiceToRequest(userId: string, requestId: string, invoiceId: string): Promise<ProcurementRequest | null> {
    return this.procurement.matchInvoice(userId, requestId, invoiceId)
  }

  async approveProcurementRequest(userId: string, requestId: string, approvedBy: string): Promise<ProcurementRequest | null> {
    return this.procurement.approveRequest(userId, requestId, approvedBy)
  }

  async rejectProcurementRequest(userId: string, requestId: string, rejectedBy: string): Promise<ProcurementRequest | null> {
    return this.procurement.rejectRequest(userId, requestId, rejectedBy)
  }

  // ── Assets ────────────────────────────────────────────────────────────────

  async registerAsset(userId: string, fields: Omit<Asset, 'id' | 'userId' | 'status' | 'assignmentHistory' | 'createdAt' | 'updatedAt'>): Promise<Asset> {
    return this.assets.registerAsset(userId, fields)
  }

  async getAsset(userId: string, assetId: string): Promise<Asset | null> {
    return this.assets.getAsset(userId, assetId)
  }

  async listAssets(userId: string, opts?: { status?: AssetStatus; category?: string }): Promise<Asset[]> {
    return this.assets.listAssets(userId, opts ?? {})
  }

  async assignAsset(userId: string, assetId: string, assignedTo: string): Promise<Asset | null> {
    return this.assets.assignAsset(userId, assetId, assignedTo)
  }

  async returnAsset(userId: string, assetId: string): Promise<Asset | null> {
    return this.assets.returnAsset(userId, assetId)
  }

  async scheduleAssetMaintenance(userId: string, assetId: string, date: string): Promise<Asset | null> {
    return this.assets.scheduleMaintenance(userId, assetId, date)
  }

  async checkMaintenanceDue(userId: string): Promise<Asset[]> {
    return this.assets.checkMaintenanceDue(userId)
  }

  async disposeAsset(userId: string, assetId: string, notes: string): Promise<Asset | null> {
    return this.assets.disposeAsset(userId, assetId, notes)
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  async getStats(userId: string): Promise<FinanceStats> {
    return this.analytics.getStats(userId)
  }

  async getMonthlyReport(userId: string, year: number, month: number) {
    return this.analytics.getMonthlyReport(userId, year, month)
  }

  async getYearlyReport(userId: string, year: number) {
    return this.analytics.getYearlyReport(userId, year)
  }

  // ── Suggestions / Scheduler ───────────────────────────────────────────────

  async runReminderChecks(userId: string): Promise<FinanceSuggestion[]> {
    return this.scheduler.runAllChecks(userId)
  }

  async listPendingSuggestions(userId: string): Promise<FinanceSuggestion[]> {
    return this.scheduler.listPendingSuggestions(userId)
  }

  async dismissSuggestion(userId: string, suggestionId: string): Promise<void> {
    return this.scheduler.dismissSuggestion(userId, suggestionId)
  }

  // ── Document Intelligence Integration ────────────────────────────────────
  // Invoices flow: OCR (DocumentParser) -> Entity Extraction -> this method
  // creates/updates the Invoice record and returns a suggested Expense shape.
  // It never writes the Expense itself — actual Expense creation happens via
  // explicit approval through ActionEngine elsewhere in the system.

  async linkInvoiceDocument(
    userId: string,
    documentId: string,
    extractedFields: {
      vendorId?: string
      invoiceNumber: string
      lineItems?: Invoice['lineItems']
      totalAmount: number
      currency: string
      issuedAt: string
      dueDate: string
    }
  ): Promise<{ invoice: Invoice; suggestedExpense: Omit<Expense, 'id' | 'userId' | 'approvalStatus' | 'createdAt' | 'updatedAt'> }> {
    const invoice = await this.invoices.createInvoice(userId, {
      vendorId: extractedFields.vendorId,
      invoiceNumber: extractedFields.invoiceNumber,
      lineItems: extractedFields.lineItems ?? [],
      totalAmount: extractedFields.totalAmount,
      currency: extractedFields.currency,
      issuedAt: extractedFields.issuedAt,
      dueDate: extractedFields.dueDate,
      documentId,
    })
    void FinanceEvents.emit('invoice:ingested', userId, { invoiceId: invoice.id, documentId })
    void this.linkInvoiceToMemory(userId, invoice)

    const suggestedExpense: Omit<Expense, 'id' | 'userId' | 'approvalStatus' | 'createdAt' | 'updatedAt'> = {
      vendorId: extractedFields.vendorId,
      category: 'other',
      description: `Invoice ${extractedFields.invoiceNumber}`,
      amount: extractedFields.totalAmount,
      currency: extractedFields.currency,
      paymentMethod: 'bank_transfer',
      attachments: [{ id: documentId, documentId, filename: `invoice-${extractedFields.invoiceNumber}` }],
      incurredAt: extractedFields.issuedAt,
    }

    return { invoice, suggestedExpense }
  }

  // ── Memory Graph Integration ──────────────────────────────────────────────
  // Vendor -> Invoice -> Payment, Budget/Procurement linked best-effort.

  private async linkBudgetToMemory(userId: string, budget: Budget): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      const { node } = await graph.upsertNode(
        'project',
        budget.name,
        `${budget.period} budget: ${budget.amount}`,
        { budgetId: budget.id },
        30
      )
      await this.budgets.setMemoryNodeId(userId, budget.id, node.id)
    } catch {
      // best-effort
    }
  }

  private async linkVendorToMemory(userId: string, vendor: Vendor): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      const { node } = await graph.upsertNode(
        'organization',
        vendor.name,
        `Vendor (${vendor.status})`,
        { vendorId: vendor.id },
        40
      )
      await this.vendors.setMemoryNodeId(userId, vendor.id, node.id)
    } catch {
      // best-effort
    }
  }

  private async linkInvoiceToMemory(userId: string, invoice: Invoice): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      const vendor = invoice.vendorId ? await this.vendors.getVendor(userId, invoice.vendorId) : null
      const { node: invoiceNode } = await graph.upsertNode(
        'expense',
        `Invoice ${invoice.invoiceNumber}`,
        `${invoice.currency} ${invoice.totalAmount}, due ${invoice.dueDate}`,
        { invoiceId: invoice.id, status: invoice.status },
        30
      )
      await this.invoices.setMemoryNodeId(userId, invoice.id, invoiceNode.id)
      if (vendor?.memoryNodeId) {
        await graph.upsertEdge(vendor.memoryNodeId, invoiceNode.id, 'RELATED_TO', { weight: 0.6, confidence: 0.8 })
      }
    } catch {
      // best-effort
    }
  }

  private async linkPaymentToMemory(userId: string, payment: Payment): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      const invoice = payment.invoiceId ? await this.invoices.getInvoice(userId, payment.invoiceId) : null
      const { node: paymentNode } = await graph.upsertNode(
        'expense',
        `Payment ${payment.id}`,
        `${payment.currency} ${payment.amount} via ${payment.method}`,
        { paymentId: payment.id, status: payment.status },
        25
      )
      await this.payments.setMemoryNodeId(userId, payment.id, paymentNode.id)
      if (invoice?.memoryNodeId) {
        await graph.upsertEdge(invoice.memoryNodeId, paymentNode.id, 'RELATED_TO', { weight: 0.7, confidence: 0.85 })
      }
    } catch {
      // best-effort
    }
  }

  private async linkProcurementToMemory(userId: string, request: ProcurementRequest): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      const { node } = await graph.upsertNode(
        'task',
        request.title,
        request.description,
        { procurementRequestId: request.id, status: request.status },
        25
      )
      await this.procurement.setMemoryNodeId(userId, request.id, node.id)
    } catch {
      // best-effort
    }
  }
}
