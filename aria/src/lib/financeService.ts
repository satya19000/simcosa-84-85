import { httpsCallable } from 'firebase/functions'
import { functions as fns } from './firebase'

const getFinanceProviderHealthFn = httpsCallable(fns, 'getFinanceProviderHealth')
const listFinanceProvidersFn = httpsCallable(fns, 'listFinanceProviders')
const createBudgetFn = httpsCallable(fns, 'createBudget')
const getBudgetFn = httpsCallable(fns, 'getBudget')
const listBudgetsFn = httpsCallable(fns, 'listBudgets')
const forecastBudgetFn = httpsCallable(fns, 'forecastBudget')
const recordExpenseFn = httpsCallable(fns, 'recordExpense')
const getExpenseFn = httpsCallable(fns, 'getExpense')
const listExpensesFn = httpsCallable(fns, 'listExpenses')
const approveExpenseFn = httpsCallable(fns, 'approveExpense')
const rejectExpenseFn = httpsCallable(fns, 'rejectExpense')
const markExpenseReimbursedFn = httpsCallable(fns, 'markExpenseReimbursed')
const recordIncomeFn = httpsCallable(fns, 'recordIncome')
const listIncomeFn = httpsCallable(fns, 'listIncome')
const createVendorFn = httpsCallable(fns, 'createVendor')
const listVendorsFn = httpsCallable(fns, 'listVendors')
const searchVendorsFn = httpsCallable(fns, 'searchVendors')
const evaluateVendorFn = httpsCallable(fns, 'evaluateVendor')
const createInvoiceFn = httpsCallable(fns, 'createInvoice')
const listInvoicesFn = httpsCallable(fns, 'listInvoices')
const markInvoicePaidFn = httpsCallable(fns, 'markInvoicePaid')
const detectOverdueInvoicesFn = httpsCallable(fns, 'detectOverdueInvoices')
const linkInvoiceDocumentFn = httpsCallable(fns, 'linkInvoiceDocument')
const recordPaymentFn = httpsCallable(fns, 'recordPayment')
const listPaymentsFn = httpsCallable(fns, 'listPayments')
const createProcurementRequestFn = httpsCallable(fns, 'createProcurementRequest')
const listProcurementRequestsFn = httpsCallable(fns, 'listProcurementRequests')
const addQuotationFn = httpsCallable(fns, 'addQuotation')
const compareQuotationsFn = httpsCallable(fns, 'compareQuotations')
const selectVendorForRequestFn = httpsCallable(fns, 'selectVendorForRequest')
const issuePurchaseOrderFn = httpsCallable(fns, 'issuePurchaseOrder')
const recordGoodsReceiptFn = httpsCallable(fns, 'recordGoodsReceipt')
const matchInvoiceToRequestFn = httpsCallable(fns, 'matchInvoiceToRequest')
const approveProcurementRequestFn = httpsCallable(fns, 'approveProcurementRequest')
const rejectProcurementRequestFn = httpsCallable(fns, 'rejectProcurementRequest')
const registerAssetFn = httpsCallable(fns, 'registerAsset')
const listAssetsFn = httpsCallable(fns, 'listAssets')
const assignAssetFn = httpsCallable(fns, 'assignAsset')
const returnAssetFn = httpsCallable(fns, 'returnAsset')
const scheduleAssetMaintenanceFn = httpsCallable(fns, 'scheduleAssetMaintenance')
const checkAssetMaintenanceDueFn = httpsCallable(fns, 'checkAssetMaintenanceDue')
const disposeAssetFn = httpsCallable(fns, 'disposeAsset')
const getFinanceStatsFn = httpsCallable(fns, 'getFinanceStats')
const getFinanceMonthlyReportFn = httpsCallable(fns, 'getFinanceMonthlyReport')
const getFinanceYearlyReportFn = httpsCallable(fns, 'getFinanceYearlyReport')
const runFinanceReminderChecksFn = httpsCallable(fns, 'runFinanceReminderChecks')
const listFinanceSuggestionsFn = httpsCallable(fns, 'listFinanceSuggestions')
const dismissFinanceSuggestionFn = httpsCallable(fns, 'dismissFinanceSuggestion')

export type BudgetPeriod = 'annual' | 'monthly' | 'quarterly' | 'project' | 'department' | 'custom'
export type BudgetStatus = 'active' | 'closed' | 'over_budget' | 'draft'
export type ExpenseCategory =
  | 'travel' | 'supplies' | 'utilities' | 'salaries' | 'rent' | 'equipment'
  | 'marketing' | 'professional_services' | 'maintenance' | 'medical' | 'other'
export type ExpenseApprovalStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed'
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'upi' | 'cheque' | 'other'
export type RecurrenceRule = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none'
export type InvoiceStatus = 'draft' | 'sent' | 'approved' | 'paid' | 'overdue' | 'cancelled'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type ProcurementStatus =
  | 'requested' | 'quotation_pending' | 'quotation_received' | 'po_issued'
  | 'goods_received' | 'invoice_matched' | 'completed' | 'rejected'
export type AssetStatus = 'active' | 'in_maintenance' | 'disposed' | 'lost'
export type VendorStatus = 'active' | 'inactive' | 'blacklisted'

export interface ProviderHealth {
  providerId: string
  status: string
  lastCheckedAt: string
  latencyMs?: number
  error?: string
}

export interface Budget {
  id: string
  userId: string
  name: string
  period: BudgetPeriod
  status: BudgetStatus
  amount: number
  spent: number
  departmentId?: string
  projectId?: string
  startDate: string
  endDate: string
  alertThresholdPct?: number
  memoryNodeId?: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseAttachment {
  id: string
  documentId?: string
  filename: string
  url?: string
}

export interface Expense {
  id: string
  userId: string
  budgetId?: string
  vendorId?: string
  category: ExpenseCategory
  description: string
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  approvalStatus: ExpenseApprovalStatus
  attachments: ExpenseAttachment[]
  recurrence?: RecurrenceRule
  incurredAt: string
  approvedBy?: string
  memoryNodeId?: string
  createdAt: string
  updatedAt: string
}

export interface Income {
  id: string
  userId: string
  source: string
  category: 'salary' | 'grant' | 'donation' | 'sales' | 'investment' | 'other'
  amount: number
  currency: string
  fundingSourceId?: string
  receivedAt: string
  createdAt: string
  updatedAt: string
}

export interface Vendor {
  id: string
  userId: string
  name: string
  status: VendorStatus
  contactEmail?: string
  contactPhone?: string
  rating?: number
  evaluationNotes?: string[]
  memoryNodeId?: string
  createdAt: string
  updatedAt: string
}

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string
  userId: string
  vendorId?: string
  invoiceNumber: string
  status: InvoiceStatus
  lineItems: InvoiceLineItem[]
  totalAmount: number
  currency: string
  issuedAt: string
  dueDate: string
  paidAt?: string
  documentId?: string
  memoryNodeId?: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  userId: string
  invoiceId?: string
  expenseId?: string
  vendorId?: string
  amount: number
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  reference?: string
  paidAt: string
  memoryNodeId?: string
  createdAt: string
  updatedAt: string
}

export interface Quotation {
  id: string
  vendorId: string
  amount: number
  notes?: string
  submittedAt: string
}

export interface ProcurementRequest {
  id: string
  userId: string
  projectId?: string
  departmentId?: string
  title: string
  description: string
  status: ProcurementStatus
  quotations: Quotation[]
  selectedVendorId?: string
  purchaseOrderNumber?: string
  invoiceId?: string
  approvedBy?: string
  memoryNodeId?: string
  createdAt: string
  updatedAt: string
}

export interface AssetAssignmentEntry {
  id: string
  assignedTo: string
  assignedAt: string
  returnedAt?: string
}

export interface Asset {
  id: string
  userId: string
  name: string
  status: AssetStatus
  category: string
  purchaseValue: number
  purchaseDate: string
  warrantyExpiresAt?: string
  nextMaintenanceAt?: string
  assignmentHistory: AssetAssignmentEntry[]
  disposedAt?: string
  disposalNotes?: string
  memoryNodeId?: string
  createdAt: string
  updatedAt: string
}

export interface FinanceStats {
  totalIncome: number
  totalExpenses: number
  cashFlow: number
  totalBudgets: number
  budgetUtilizationRate: number
  pendingInvoices: number
  overdueInvoices: number
  pendingApprovals: number
  assetsCount: number
  vendorsCount: number
  byExpenseCategory: Record<string, number>
}

export type FinanceSuggestionType =
  | 'payment_reminder' | 'invoice_reminder' | 'budget_alert' | 'vendor_follow_up' | 'approval_request'

export interface FinanceSuggestion {
  id: string
  scopeId: string
  type: FinanceSuggestionType
  title: string
  description: string
  requiresApproval: true
  createdAt: string
}

export async function getFinanceProviderHealth(): Promise<ProviderHealth[]> {
  const result = await getFinanceProviderHealthFn({})
  return result.data as ProviderHealth[]
}

export async function listFinanceProviders(): Promise<Array<{ id: string; name: string; type: string }>> {
  const result = await listFinanceProvidersFn({})
  return result.data as Array<{ id: string; name: string; type: string }>
}

export async function createBudget(fields: Omit<Budget, 'id' | 'userId' | 'status' | 'spent' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
  const result = await createBudgetFn(fields)
  return result.data as Budget
}

export async function getBudget(budgetId: string): Promise<Budget | null> {
  const result = await getBudgetFn({ budgetId })
  return result.data as Budget | null
}

export async function listBudgets(opts?: { period?: BudgetPeriod; status?: BudgetStatus }): Promise<Budget[]> {
  const result = await listBudgetsFn(opts ?? {})
  return result.data as Budget[]
}

export async function forecastBudget(budgetId: string): Promise<{ projectedTotal: number; willExceed: boolean } | null> {
  const result = await forecastBudgetFn({ budgetId })
  return result.data as { projectedTotal: number; willExceed: boolean } | null
}

export async function recordExpense(fields: Omit<Expense, 'id' | 'userId' | 'approvalStatus' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
  const result = await recordExpenseFn(fields)
  return result.data as Expense
}

export async function getExpense(expenseId: string): Promise<Expense | null> {
  const result = await getExpenseFn({ expenseId })
  return result.data as Expense | null
}

export async function listExpenses(opts?: { category?: ExpenseCategory; approvalStatus?: ExpenseApprovalStatus; budgetId?: string }): Promise<Expense[]> {
  const result = await listExpensesFn(opts ?? {})
  return result.data as Expense[]
}

export async function approveExpense(expenseId: string): Promise<Expense | null> {
  const result = await approveExpenseFn({ expenseId })
  return result.data as Expense | null
}

export async function rejectExpense(expenseId: string): Promise<Expense | null> {
  const result = await rejectExpenseFn({ expenseId })
  return result.data as Expense | null
}

export async function markExpenseReimbursed(expenseId: string): Promise<void> {
  await markExpenseReimbursedFn({ expenseId })
}

export async function recordIncome(fields: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Income> {
  const result = await recordIncomeFn(fields)
  return result.data as Income
}

export async function listIncome(opts?: { category?: Income['category']; fundingSourceId?: string }): Promise<Income[]> {
  const result = await listIncomeFn(opts ?? {})
  return result.data as Income[]
}

export async function createVendor(fields: Omit<Vendor, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Vendor> {
  const result = await createVendorFn(fields)
  return result.data as Vendor
}

export async function listVendors(opts?: { status?: VendorStatus }): Promise<Vendor[]> {
  const result = await listVendorsFn(opts ?? {})
  return result.data as Vendor[]
}

export async function searchVendors(term: string): Promise<Vendor[]> {
  const result = await searchVendorsFn({ term })
  return result.data as Vendor[]
}

export async function evaluateVendor(vendorId: string, rating: number, note?: string): Promise<Vendor | null> {
  const result = await evaluateVendorFn({ vendorId, rating, note })
  return result.data as Vendor | null
}

export async function createInvoice(fields: Omit<Invoice, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
  const result = await createInvoiceFn(fields)
  return result.data as Invoice
}

export async function listInvoices(opts?: { status?: InvoiceStatus; vendorId?: string }): Promise<Invoice[]> {
  const result = await listInvoicesFn(opts ?? {})
  return result.data as Invoice[]
}

export async function markInvoicePaid(invoiceId: string): Promise<Invoice | null> {
  const result = await markInvoicePaidFn({ invoiceId })
  return result.data as Invoice | null
}

export async function detectOverdueInvoices(): Promise<Invoice[]> {
  const result = await detectOverdueInvoicesFn({})
  return result.data as Invoice[]
}

export async function linkInvoiceDocument(
  documentId: string,
  extractedFields: {
    vendorId?: string
    invoiceNumber: string
    lineItems?: InvoiceLineItem[]
    totalAmount: number
    currency: string
    issuedAt: string
    dueDate: string
  }
): Promise<{ invoice: Invoice; suggestedExpense: Omit<Expense, 'id' | 'userId' | 'approvalStatus' | 'createdAt' | 'updatedAt'> }> {
  const result = await linkInvoiceDocumentFn({ documentId, extractedFields })
  return result.data as { invoice: Invoice; suggestedExpense: Omit<Expense, 'id' | 'userId' | 'approvalStatus' | 'createdAt' | 'updatedAt'> }
}

export async function recordPayment(fields: Omit<Payment, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
  const result = await recordPaymentFn(fields)
  return result.data as Payment
}

export async function listPayments(opts?: { status?: PaymentStatus; invoiceId?: string; expenseId?: string }): Promise<Payment[]> {
  const result = await listPaymentsFn(opts ?? {})
  return result.data as Payment[]
}

export async function createProcurementRequest(fields: Omit<ProcurementRequest, 'id' | 'userId' | 'status' | 'quotations' | 'createdAt' | 'updatedAt'>): Promise<ProcurementRequest> {
  const result = await createProcurementRequestFn(fields)
  return result.data as ProcurementRequest
}

export async function listProcurementRequests(opts?: { status?: ProcurementStatus }): Promise<ProcurementRequest[]> {
  const result = await listProcurementRequestsFn(opts ?? {})
  return result.data as ProcurementRequest[]
}

export async function addQuotation(requestId: string, quotation: Omit<Quotation, 'id' | 'submittedAt'>): Promise<ProcurementRequest | null> {
  const result = await addQuotationFn({ requestId, quotation })
  return result.data as ProcurementRequest | null
}

export async function compareQuotations(requestId: string): Promise<Quotation[]> {
  const result = await compareQuotationsFn({ requestId })
  return result.data as Quotation[]
}

export async function selectVendorForRequest(requestId: string, vendorId: string): Promise<ProcurementRequest | null> {
  const result = await selectVendorForRequestFn({ requestId, vendorId })
  return result.data as ProcurementRequest | null
}

export async function issuePurchaseOrder(requestId: string, purchaseOrderNumber: string): Promise<ProcurementRequest | null> {
  const result = await issuePurchaseOrderFn({ requestId, purchaseOrderNumber })
  return result.data as ProcurementRequest | null
}

export async function recordGoodsReceipt(requestId: string): Promise<ProcurementRequest | null> {
  const result = await recordGoodsReceiptFn({ requestId })
  return result.data as ProcurementRequest | null
}

export async function matchInvoiceToRequest(requestId: string, invoiceId: string): Promise<ProcurementRequest | null> {
  const result = await matchInvoiceToRequestFn({ requestId, invoiceId })
  return result.data as ProcurementRequest | null
}

export async function approveProcurementRequest(requestId: string): Promise<ProcurementRequest | null> {
  const result = await approveProcurementRequestFn({ requestId })
  return result.data as ProcurementRequest | null
}

export async function rejectProcurementRequest(requestId: string): Promise<ProcurementRequest | null> {
  const result = await rejectProcurementRequestFn({ requestId })
  return result.data as ProcurementRequest | null
}

export async function registerAsset(fields: Omit<Asset, 'id' | 'userId' | 'status' | 'assignmentHistory' | 'createdAt' | 'updatedAt'>): Promise<Asset> {
  const result = await registerAssetFn(fields)
  return result.data as Asset
}

export async function listAssets(opts?: { status?: AssetStatus; category?: string }): Promise<Asset[]> {
  const result = await listAssetsFn(opts ?? {})
  return result.data as Asset[]
}

export async function assignAsset(assetId: string, assignedTo: string): Promise<Asset | null> {
  const result = await assignAssetFn({ assetId, assignedTo })
  return result.data as Asset | null
}

export async function returnAsset(assetId: string): Promise<Asset | null> {
  const result = await returnAssetFn({ assetId })
  return result.data as Asset | null
}

export async function scheduleAssetMaintenance(assetId: string, date: string): Promise<Asset | null> {
  const result = await scheduleAssetMaintenanceFn({ assetId, date })
  return result.data as Asset | null
}

export async function checkAssetMaintenanceDue(): Promise<Asset[]> {
  const result = await checkAssetMaintenanceDueFn({})
  return result.data as Asset[]
}

export async function disposeAsset(assetId: string, notes: string): Promise<Asset | null> {
  const result = await disposeAssetFn({ assetId, notes })
  return result.data as Asset | null
}

export async function getFinanceStats(): Promise<FinanceStats> {
  const result = await getFinanceStatsFn({})
  return result.data as FinanceStats
}

export async function getFinanceMonthlyReport(year: number, month: number): Promise<{ year: number; month: number; income: number; expenses: number; cashFlow: number; byCategory: Record<string, number> }> {
  const result = await getFinanceMonthlyReportFn({ year, month })
  return result.data as { year: number; month: number; income: number; expenses: number; cashFlow: number; byCategory: Record<string, number> }
}

export async function getFinanceYearlyReport(year: number): Promise<{ year: number; income: number; expenses: number; cashFlow: number; byCategory: Record<string, number> }> {
  const result = await getFinanceYearlyReportFn({ year })
  return result.data as { year: number; income: number; expenses: number; cashFlow: number; byCategory: Record<string, number> }
}

export async function runFinanceReminderChecks(): Promise<FinanceSuggestion[]> {
  const result = await runFinanceReminderChecksFn({})
  return result.data as FinanceSuggestion[]
}

export async function listFinanceSuggestions(): Promise<FinanceSuggestion[]> {
  const result = await listFinanceSuggestionsFn({})
  return result.data as FinanceSuggestion[]
}

export async function dismissFinanceSuggestion(suggestionId: string): Promise<void> {
  await dismissFinanceSuggestionFn({ suggestionId })
}
