import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { getFinanceEngine } from './finance'
import type {
  Budget, BudgetPeriod, BudgetStatus,
  Expense, ExpenseApprovalStatus, ExpenseCategory,
  Income,
  Vendor, VendorStatus,
  Invoice, InvoiceStatus,
  Payment, PaymentStatus,
  ProcurementRequest, ProcurementStatus, Quotation,
  Asset, AssetStatus,
} from './finance/FinanceTypes'

function db(): admin.firestore.Firestore {
  return admin.firestore()
}

function apiKey(): string {
  return process.env.ANTHROPIC_API_KEY ?? ''
}

// ── Providers ─────────────────────────────────────────────────────────────────

export const getFinanceProviderHealth = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.healthCheckAll(request.auth.uid)
  }
)

export const listFinanceProviders = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.listProviders()
  }
)

// ── Budgets ───────────────────────────────────────────────────────────────────

export const createBudget = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const fields = request.data as Omit<Budget, 'id' | 'userId' | 'status' | 'spent' | 'createdAt' | 'updatedAt'>
    if (!fields?.name || fields?.amount === undefined) throw new HttpsError('invalid-argument', 'name and amount required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.createBudget(request.auth.uid, fields)
  }
)

export const getBudget = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { budgetId } = request.data as { budgetId: string }
    if (!budgetId) throw new HttpsError('invalid-argument', 'budgetId required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.getBudget(request.auth.uid, budgetId)
  }
)

export const listBudgets = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const opts = (request.data ?? {}) as { period?: BudgetPeriod; status?: BudgetStatus }
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.listBudgets(request.auth.uid, opts)
  }
)

export const forecastBudget = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { budgetId } = request.data as { budgetId: string }
    if (!budgetId) throw new HttpsError('invalid-argument', 'budgetId required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.forecastBudget(request.auth.uid, budgetId)
  }
)

// ── Expenses ──────────────────────────────────────────────────────────────────

export const recordExpense = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const fields = request.data as Omit<Expense, 'id' | 'userId' | 'approvalStatus' | 'createdAt' | 'updatedAt'>
    if (!fields?.description || fields?.amount === undefined) throw new HttpsError('invalid-argument', 'description and amount required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.recordExpense(request.auth.uid, fields)
  }
)

export const getExpense = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { expenseId } = request.data as { expenseId: string }
    if (!expenseId) throw new HttpsError('invalid-argument', 'expenseId required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.getExpense(request.auth.uid, expenseId)
  }
)

export const listExpenses = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const opts = (request.data ?? {}) as { category?: ExpenseCategory; approvalStatus?: ExpenseApprovalStatus; budgetId?: string }
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.listExpenses(request.auth.uid, opts)
  }
)

export const approveExpense = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { expenseId } = request.data as { expenseId: string }
    if (!expenseId) throw new HttpsError('invalid-argument', 'expenseId required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.approveExpense(request.auth.uid, expenseId, request.auth.uid)
  }
)

export const rejectExpense = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { expenseId } = request.data as { expenseId: string }
    if (!expenseId) throw new HttpsError('invalid-argument', 'expenseId required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.rejectExpense(request.auth.uid, expenseId, request.auth.uid)
  }
)

export const markExpenseReimbursed = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { expenseId } = request.data as { expenseId: string }
    if (!expenseId) throw new HttpsError('invalid-argument', 'expenseId required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    await engine.markExpenseReimbursed(request.auth.uid, expenseId)
    return { success: true }
  }
)

// ── Income ────────────────────────────────────────────────────────────────────

export const recordIncome = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const fields = request.data as Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    if (!fields?.source || fields?.amount === undefined) throw new HttpsError('invalid-argument', 'source and amount required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.recordIncome(request.auth.uid, fields)
  }
)

export const listIncome = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const opts = (request.data ?? {}) as { category?: Income['category']; fundingSourceId?: string }
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.listIncome(request.auth.uid, opts)
  }
)

// ── Vendors ───────────────────────────────────────────────────────────────────

export const createVendor = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const fields = request.data as Omit<Vendor, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>
    if (!fields?.name) throw new HttpsError('invalid-argument', 'name required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.createVendor(request.auth.uid, fields)
  }
)

export const listVendors = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const opts = (request.data ?? {}) as { status?: VendorStatus }
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.listVendors(request.auth.uid, opts)
  }
)

export const searchVendors = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { term } = request.data as { term: string }
    if (!term) throw new HttpsError('invalid-argument', 'term required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.searchVendors(request.auth.uid, term)
  }
)

export const evaluateVendor = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { vendorId, rating, note } = request.data as { vendorId: string; rating: number; note?: string }
    if (!vendorId || rating === undefined) throw new HttpsError('invalid-argument', 'vendorId and rating required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.evaluateVendor(request.auth.uid, vendorId, rating, note)
  }
)

// ── Invoices ──────────────────────────────────────────────────────────────────

export const createInvoice = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const fields = request.data as Omit<Invoice, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>
    if (!fields?.invoiceNumber || fields?.totalAmount === undefined) throw new HttpsError('invalid-argument', 'invoiceNumber and totalAmount required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.createInvoice(request.auth.uid, fields)
  }
)

export const listInvoices = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const opts = (request.data ?? {}) as { status?: InvoiceStatus; vendorId?: string }
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.listInvoices(request.auth.uid, opts)
  }
)

export const markInvoicePaid = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { invoiceId } = request.data as { invoiceId: string }
    if (!invoiceId) throw new HttpsError('invalid-argument', 'invoiceId required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.markInvoicePaid(request.auth.uid, invoiceId)
  }
)

export const detectOverdueInvoices = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.detectOverdueInvoices(request.auth.uid)
  }
)

export const linkInvoiceDocument = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { documentId, extractedFields } = request.data as {
      documentId: string
      extractedFields: {
        vendorId?: string
        invoiceNumber: string
        lineItems?: Invoice['lineItems']
        totalAmount: number
        currency: string
        issuedAt: string
        dueDate: string
      }
    }
    if (!documentId || !extractedFields?.invoiceNumber) throw new HttpsError('invalid-argument', 'documentId and extractedFields.invoiceNumber required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.linkInvoiceDocument(request.auth.uid, documentId, extractedFields)
  }
)

// ── Payments ──────────────────────────────────────────────────────────────────

export const recordPayment = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const fields = request.data as Omit<Payment, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>
    if (fields?.amount === undefined) throw new HttpsError('invalid-argument', 'amount required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.recordPayment(request.auth.uid, fields)
  }
)

export const listPayments = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const opts = (request.data ?? {}) as { status?: PaymentStatus; invoiceId?: string; expenseId?: string }
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.listPayments(request.auth.uid, opts)
  }
)

// ── Procurement ───────────────────────────────────────────────────────────────

export const createProcurementRequest = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const fields = request.data as Omit<ProcurementRequest, 'id' | 'userId' | 'status' | 'quotations' | 'createdAt' | 'updatedAt'>
    if (!fields?.title) throw new HttpsError('invalid-argument', 'title required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.createProcurementRequest(request.auth.uid, fields)
  }
)

export const listProcurementRequests = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const opts = (request.data ?? {}) as { status?: ProcurementStatus }
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.listProcurementRequests(request.auth.uid, opts)
  }
)

export const addQuotation = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestId, quotation } = request.data as { requestId: string; quotation: Omit<Quotation, 'id' | 'submittedAt'> }
    if (!requestId || !quotation) throw new HttpsError('invalid-argument', 'requestId and quotation required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.addQuotation(request.auth.uid, requestId, quotation)
  }
)

export const compareQuotations = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestId } = request.data as { requestId: string }
    if (!requestId) throw new HttpsError('invalid-argument', 'requestId required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.compareQuotations(request.auth.uid, requestId)
  }
)

export const selectVendorForRequest = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestId, vendorId } = request.data as { requestId: string; vendorId: string }
    if (!requestId || !vendorId) throw new HttpsError('invalid-argument', 'requestId and vendorId required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.selectVendorForRequest(request.auth.uid, requestId, vendorId)
  }
)

export const issuePurchaseOrder = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestId, purchaseOrderNumber } = request.data as { requestId: string; purchaseOrderNumber: string }
    if (!requestId || !purchaseOrderNumber) throw new HttpsError('invalid-argument', 'requestId and purchaseOrderNumber required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.issuePurchaseOrder(request.auth.uid, requestId, purchaseOrderNumber)
  }
)

export const recordGoodsReceipt = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestId } = request.data as { requestId: string }
    if (!requestId) throw new HttpsError('invalid-argument', 'requestId required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.recordGoodsReceipt(request.auth.uid, requestId)
  }
)

export const matchInvoiceToRequest = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestId, invoiceId } = request.data as { requestId: string; invoiceId: string }
    if (!requestId || !invoiceId) throw new HttpsError('invalid-argument', 'requestId and invoiceId required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.matchInvoiceToRequest(request.auth.uid, requestId, invoiceId)
  }
)

export const approveProcurementRequest = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestId } = request.data as { requestId: string }
    if (!requestId) throw new HttpsError('invalid-argument', 'requestId required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.approveProcurementRequest(request.auth.uid, requestId, request.auth.uid)
  }
)

export const rejectProcurementRequest = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestId } = request.data as { requestId: string }
    if (!requestId) throw new HttpsError('invalid-argument', 'requestId required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.rejectProcurementRequest(request.auth.uid, requestId, request.auth.uid)
  }
)

// ── Assets ────────────────────────────────────────────────────────────────────

export const registerAsset = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const fields = request.data as Omit<Asset, 'id' | 'userId' | 'status' | 'assignmentHistory' | 'createdAt' | 'updatedAt'>
    if (!fields?.name) throw new HttpsError('invalid-argument', 'name required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.registerAsset(request.auth.uid, fields)
  }
)

export const listAssets = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const opts = (request.data ?? {}) as { status?: AssetStatus; category?: string }
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.listAssets(request.auth.uid, opts)
  }
)

export const assignAsset = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { assetId, assignedTo } = request.data as { assetId: string; assignedTo: string }
    if (!assetId || !assignedTo) throw new HttpsError('invalid-argument', 'assetId and assignedTo required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.assignAsset(request.auth.uid, assetId, assignedTo)
  }
)

export const returnAsset = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { assetId } = request.data as { assetId: string }
    if (!assetId) throw new HttpsError('invalid-argument', 'assetId required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.returnAsset(request.auth.uid, assetId)
  }
)

export const scheduleAssetMaintenance = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { assetId, date } = request.data as { assetId: string; date: string }
    if (!assetId || !date) throw new HttpsError('invalid-argument', 'assetId and date required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.scheduleAssetMaintenance(request.auth.uid, assetId, date)
  }
)

export const checkAssetMaintenanceDue = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.checkMaintenanceDue(request.auth.uid)
  }
)

export const disposeAsset = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { assetId, notes } = request.data as { assetId: string; notes: string }
    if (!assetId) throw new HttpsError('invalid-argument', 'assetId required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.disposeAsset(request.auth.uid, assetId, notes ?? '')
  }
)

// ── Analytics ─────────────────────────────────────────────────────────────────

export const getFinanceStats = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.getStats(request.auth.uid)
  }
)

export const getFinanceMonthlyReport = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { year, month } = request.data as { year: number; month: number }
    if (!year || !month) throw new HttpsError('invalid-argument', 'year and month required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.getMonthlyReport(request.auth.uid, year, month)
  }
)

export const getFinanceYearlyReport = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { year } = request.data as { year: number }
    if (!year) throw new HttpsError('invalid-argument', 'year required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.getYearlyReport(request.auth.uid, year)
  }
)

// ── Reminders / Suggestions ───────────────────────────────────────────────────

export const runFinanceReminderChecks = onCall(
  { timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.runReminderChecks(request.auth.uid)
  }
)

export const listFinanceSuggestions = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    return engine.listPendingSuggestions(request.auth.uid)
  }
)

export const dismissFinanceSuggestion = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { suggestionId } = request.data as { suggestionId: string }
    if (!suggestionId) throw new HttpsError('invalid-argument', 'suggestionId required')
    const engine = getFinanceEngine(request.auth.uid, db(), apiKey())
    await engine.dismissSuggestion(request.auth.uid, suggestionId)
    return { success: true }
  }
)
