import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { FinanceSuggestion, FinanceSuggestionType } from './FinanceTypes'
import { InvoiceManager } from './InvoiceManager'
import { BudgetManager } from './BudgetManager'
import { VendorManager } from './VendorManager'
import { ExpenseManager } from './ExpenseManager'
import { ProcurementManager } from './ProcurementManager'
import { FinanceEvents } from './FinanceEvents'

const SUGGESTIONS_COL = (userId: string) => `users/${userId}/financeSuggestions`

// ── Finance Scheduler ────────────────────────────────────────────────────────
// Generates suggestions only — invoice/payment reminders, budget alerts,
// vendor follow-ups, approval requests. NEVER executes/sends anything; every
// suggestion requires explicit approval before any downstream action.

export class FinanceScheduler {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly invoices: InvoiceManager,
    private readonly budgets: BudgetManager,
    private readonly vendors: VendorManager,
    private readonly expenses: ExpenseManager,
    private readonly procurement: ProcurementManager,
    private readonly invoiceReminderLeadDays: number,
    private readonly vendorFollowUpDays: number
  ) {}

  private async createSuggestion(
    userId: string,
    scopeId: string,
    type: FinanceSuggestionType,
    title: string,
    description: string
  ): Promise<FinanceSuggestion> {
    const suggestion: FinanceSuggestion = {
      id: uuidv4(),
      scopeId,
      type,
      title,
      description,
      requiresApproval: true,
      createdAt: new Date().toISOString(),
    }
    await this.db.collection(SUGGESTIONS_COL(userId)).doc(suggestion.id).set(suggestion)
    void FinanceEvents.emit('reminder:suggested', userId, { suggestionId: suggestion.id, type, scopeId })
    return suggestion
  }

  async generateInvoiceReminders(userId: string): Promise<FinanceSuggestion[]> {
    const invoices = await this.invoices.listInvoices(userId, { status: 'sent' })
    const now = Date.now()
    const leadMs = this.invoiceReminderLeadDays * 24 * 60 * 60 * 1000
    const suggestions: FinanceSuggestion[] = []
    for (const inv of invoices) {
      const due = Date.parse(inv.dueDate)
      if (due - now <= leadMs && due - now > 0) {
        suggestions.push(
          await this.createSuggestion(
            userId,
            inv.id,
            'invoice_reminder',
            'Invoice Due Soon',
            `Invoice ${inv.invoiceNumber} is due on ${inv.dueDate}.`
          )
        )
      }
    }
    return suggestions
  }

  async generatePaymentReminders(userId: string): Promise<FinanceSuggestion[]> {
    const overdue = await this.invoices.detectOverdueInvoices(userId)
    const suggestions: FinanceSuggestion[] = []
    for (const inv of overdue) {
      suggestions.push(
        await this.createSuggestion(
          userId,
          inv.id,
          'payment_reminder',
          'Invoice Overdue',
          `Invoice ${inv.invoiceNumber} is overdue (was due ${inv.dueDate}).`
        )
      )
    }
    return suggestions
  }

  async generateBudgetAlerts(userId: string): Promise<FinanceSuggestion[]> {
    const budgets = await this.budgets.listBudgets(userId, { status: 'active' })
    const overBudgets = await this.budgets.listBudgets(userId, { status: 'over_budget' })
    const suggestions: FinanceSuggestion[] = []
    for (const b of [...budgets, ...overBudgets]) {
      const threshold = b.alertThresholdPct ?? 90
      if (b.amount > 0 && (b.spent / b.amount) * 100 >= threshold) {
        suggestions.push(
          await this.createSuggestion(
            userId,
            b.id,
            'budget_alert',
            'Budget Nearing/Over Limit',
            `Budget "${b.name}" has used ${Math.round((b.spent / b.amount) * 100)}% of its allocation.`
          )
        )
      }
    }
    return suggestions
  }

  async generateVendorFollowUps(userId: string): Promise<FinanceSuggestion[]> {
    const vendors = await this.vendors.listVendors(userId, { status: 'active' })
    const now = Date.now()
    const windowMs = this.vendorFollowUpDays * 24 * 60 * 60 * 1000
    const suggestions: FinanceSuggestion[] = []
    for (const v of vendors) {
      const lastTouch = Date.parse(v.updatedAt)
      if (now - lastTouch >= windowMs) {
        suggestions.push(
          await this.createSuggestion(
            userId,
            v.id,
            'vendor_follow_up',
            'Vendor Follow-up Recommended',
            `Vendor "${v.name}" has had no activity/evaluation in over ${this.vendorFollowUpDays} days.`
          )
        )
      }
    }
    return suggestions
  }

  async generateApprovalRequests(userId: string): Promise<FinanceSuggestion[]> {
    const [pendingExpenses, requestedProcurement] = await Promise.all([
      this.expenses.listExpenses(userId, { approvalStatus: 'pending' }),
      this.procurement.listRequests(userId, { status: 'requested' }),
    ])
    const suggestions: FinanceSuggestion[] = []
    for (const e of pendingExpenses) {
      suggestions.push(
        await this.createSuggestion(
          userId,
          e.id,
          'approval_request',
          'Expense Awaiting Approval',
          `Expense "${e.description}" (${e.currency} ${e.amount}) is pending approval.`
        )
      )
    }
    for (const p of requestedProcurement) {
      suggestions.push(
        await this.createSuggestion(
          userId,
          p.id,
          'approval_request',
          'Procurement Request Awaiting Approval',
          `Procurement request "${p.title}" is pending approval.`
        )
      )
    }
    return suggestions
  }

  async listPendingSuggestions(userId: string): Promise<FinanceSuggestion[]> {
    const snap = await this.db.collection(SUGGESTIONS_COL(userId)).orderBy('createdAt', 'desc').limit(100).get()
    return snap.docs.map((d) => d.data() as FinanceSuggestion)
  }

  async dismissSuggestion(userId: string, suggestionId: string): Promise<void> {
    await this.db.collection(SUGGESTIONS_COL(userId)).doc(suggestionId).delete()
  }

  async runAllChecks(userId: string): Promise<FinanceSuggestion[]> {
    const results = await Promise.all([
      this.generateInvoiceReminders(userId),
      this.generatePaymentReminders(userId),
      this.generateBudgetAlerts(userId),
      this.generateVendorFollowUps(userId),
      this.generateApprovalRequests(userId),
    ])
    return results.flat()
  }
}
