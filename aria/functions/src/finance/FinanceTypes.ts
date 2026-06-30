// ── Shared Finance Types ─────────────────────────────────────────────────────

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

export type FinanceProviderStatus = 'connected' | 'disconnected' | 'error' | 'pending'

export type FinanceEventName =
  | 'budget:created' | 'budget:exceeded' | 'budget:alert'
  | 'expense:recorded' | 'expense:approved' | 'expense:rejected'
  | 'income:recorded'
  | 'invoice:created' | 'invoice:overdue' | 'invoice:paid'
  | 'payment:recorded' | 'payment:failed'
  | 'procurement:requested' | 'procurement:approved' | 'procurement:po_issued'
  | 'asset:registered' | 'asset:disposed' | 'asset:maintenance_due'
  | 'vendor:created' | 'vendor:evaluated'
  | 'invoice:ingested' | 'reminder:suggested'

export interface FinanceEvent<T = unknown> {
  name: FinanceEventName
  userId: string
  payload: T
  emittedAt: string
}

export type FinanceRole = 'reader' | 'approver' | 'finance_admin' | 'admin'

export interface FinancePermissionRecord {
  userId: string
  scopeId: string
  role: FinanceRole
  grantedAt: string
}

export interface FinanceProviderHealth {
  providerId: string
  status: FinanceProviderStatus
  lastCheckedAt: string
  latencyMs?: number
  error?: string
}

export interface FinanceProviderSearchItem {
  id: string
  type: string
  title: string
  snippet: string
  date: string
}

export interface FinanceProviderSearchResult {
  items: FinanceProviderSearchItem[]
  total: number
}

// ── Budget ────────────────────────────────────────────────────────────────────

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

// ── Expense ───────────────────────────────────────────────────────────────────

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

// ── Income ────────────────────────────────────────────────────────────────────

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

// ── Vendor ────────────────────────────────────────────────────────────────────

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

// ── Invoice ───────────────────────────────────────────────────────────────────

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

// ── Payment ───────────────────────────────────────────────────────────────────

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

// ── Procurement ───────────────────────────────────────────────────────────────

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

// ── Asset ─────────────────────────────────────────────────────────────────────

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

// ── Analytics ─────────────────────────────────────────────────────────────────

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

// ── Suggestions (require approval) ───────────────────────────────────────────

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
