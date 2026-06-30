import type * as admin from 'firebase-admin'
import type { FinanceStats } from './FinanceTypes'
import { BudgetManager } from './BudgetManager'
import { ExpenseManager } from './ExpenseManager'
import { IncomeManager } from './IncomeManager'
import { InvoiceManager } from './InvoiceManager'
import { PaymentManager } from './PaymentManager'
import { AssetManager } from './AssetManager'
import { VendorManager } from './VendorManager'
import { ProcurementManager } from './ProcurementManager'

export class FinanceAnalytics {
  private readonly budgets: BudgetManager
  private readonly expenses: ExpenseManager
  private readonly income: IncomeManager
  private readonly invoices: InvoiceManager
  private readonly payments: PaymentManager
  private readonly assets: AssetManager
  private readonly vendors: VendorManager
  private readonly procurement: ProcurementManager

  constructor(db: admin.firestore.Firestore) {
    this.budgets = new BudgetManager(db)
    this.expenses = new ExpenseManager(db)
    this.income = new IncomeManager(db)
    this.invoices = new InvoiceManager(db)
    this.payments = new PaymentManager(db)
    this.assets = new AssetManager(db)
    this.vendors = new VendorManager(db)
    this.procurement = new ProcurementManager(db)
  }

  async getStats(userId: string): Promise<FinanceStats> {
    const [budgets, expenses, income, invoices, payments, assets, vendors, procurementRequests] = await Promise.all([
      this.budgets.listBudgets(userId),
      this.expenses.listExpenses(userId),
      this.income.listIncome(userId),
      this.invoices.listInvoices(userId),
      this.payments.listPayments(userId),
      this.assets.listAssets(userId),
      this.vendors.listVendors(userId),
      this.procurement.listRequests(userId),
    ])
    void payments

    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const cashFlow = totalIncome - totalExpenses

    const activeBudgets = budgets.filter((b) => b.status === 'active' || b.status === 'over_budget')
    const budgetUtilizationRate = activeBudgets.length > 0
      ? activeBudgets.reduce((sum, b) => sum + (b.amount > 0 ? b.spent / b.amount : 0), 0) / activeBudgets.length
      : 0

    const pendingInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'approved').length
    const overdueInvoices = invoices.filter((i) => i.status === 'overdue').length

    const pendingApprovals =
      expenses.filter((e) => e.approvalStatus === 'pending').length +
      procurementRequests.filter((p) => p.status === 'requested').length

    const byExpenseCategory: Record<string, number> = {}
    for (const e of expenses) {
      byExpenseCategory[e.category] = (byExpenseCategory[e.category] ?? 0) + e.amount
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
    }
  }

  async getMonthlyReport(userId: string, year: number, month: number): Promise<{
    year: number
    month: number
    income: number
    expenses: number
    cashFlow: number
    byCategory: Record<string, number>
  }> {
    const start = new Date(Date.UTC(year, month - 1, 1)).getTime()
    const end = new Date(Date.UTC(year, month, 1)).getTime()
    return this.getPeriodReport(userId, start, end, { year, month })
  }

  async getYearlyReport(userId: string, year: number): Promise<{
    year: number
    income: number
    expenses: number
    cashFlow: number
    byCategory: Record<string, number>
  }> {
    const start = new Date(Date.UTC(year, 0, 1)).getTime()
    const end = new Date(Date.UTC(year + 1, 0, 1)).getTime()
    return this.getPeriodReport(userId, start, end, { year })
  }

  private async getPeriodReport<T extends Record<string, unknown>>(
    userId: string,
    start: number,
    end: number,
    extra: T
  ): Promise<T & { income: number; expenses: number; cashFlow: number; byCategory: Record<string, number> }> {
    const [allExpenses, allIncome] = await Promise.all([
      this.expenses.listExpenses(userId),
      this.income.listIncome(userId),
    ])
    const periodExpenses = allExpenses.filter((e) => {
      const t = Date.parse(e.incurredAt)
      return t >= start && t < end
    })
    const periodIncome = allIncome.filter((i) => {
      const t = Date.parse(i.receivedAt)
      return t >= start && t < end
    })
    const income = periodIncome.reduce((sum, i) => sum + i.amount, 0)
    const expenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0)
    const byCategory: Record<string, number> = {}
    for (const e of periodExpenses) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount
    }
    return { ...extra, income, expenses, cashFlow: income - expenses, byCategory }
  }
}
