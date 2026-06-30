import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { Expense, ExpenseApprovalStatus, ExpenseCategory } from './FinanceTypes'
import { FinanceEvents } from './FinanceEvents'
import { BudgetManager } from './BudgetManager'

const COL = (userId: string) => `users/${userId}/expenses`

export class ExpenseManager {
  private readonly budgets: BudgetManager

  constructor(private readonly db: admin.firestore.Firestore) {
    this.budgets = new BudgetManager(db)
  }

  async recordExpense(
    userId: string,
    fields: Omit<Expense, 'id' | 'userId' | 'approvalStatus' | 'createdAt' | 'updatedAt'>
  ): Promise<Expense> {
    const now = new Date().toISOString()
    const expense: Expense = {
      id: uuidv4(),
      userId,
      approvalStatus: 'pending',
      ...fields,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(COL(userId)).doc(expense.id).set(expense)
    void FinanceEvents.emit('expense:recorded', userId, { expenseId: expense.id })
    return expense
  }

  async getExpense(userId: string, expenseId: string): Promise<Expense | null> {
    const snap = await this.db.collection(COL(userId)).doc(expenseId).get()
    return snap.exists ? (snap.data() as Expense) : null
  }

  async updateExpense(userId: string, expenseId: string, patch: Partial<Expense>): Promise<void> {
    await this.db.collection(COL(userId)).doc(expenseId).update({
      ...patch,
      updatedAt: new Date().toISOString(),
    })
  }

  async listExpenses(
    userId: string,
    opts: { category?: ExpenseCategory; approvalStatus?: ExpenseApprovalStatus; budgetId?: string } = {}
  ): Promise<Expense[]> {
    let query: admin.firestore.Query = this.db.collection(COL(userId))
    if (opts.category) query = query.where('category', '==', opts.category)
    if (opts.approvalStatus) query = query.where('approvalStatus', '==', opts.approvalStatus)
    if (opts.budgetId) query = query.where('budgetId', '==', opts.budgetId)
    const snap = await query.orderBy('incurredAt', 'desc').get()
    return snap.docs.map((d) => d.data() as Expense)
  }

  async setMemoryNodeId(userId: string, expenseId: string, memoryNodeId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(expenseId).update({ memoryNodeId })
  }

  /** Approves an expense, applies its amount against the linked budget (if any). */
  async approveExpense(userId: string, expenseId: string, approvedBy: string): Promise<Expense | null> {
    const expense = await this.getExpense(userId, expenseId)
    if (!expense) return null
    const patch: Partial<Expense> = { approvalStatus: 'approved', approvedBy }
    await this.updateExpense(userId, expenseId, patch)
    if (expense.budgetId) {
      await this.budgets.recordSpend(userId, expense.budgetId, expense.amount)
    }
    void FinanceEvents.emit('expense:approved', userId, { expenseId, approvedBy })
    return { ...expense, ...patch, updatedAt: new Date().toISOString() }
  }

  async rejectExpense(userId: string, expenseId: string, rejectedBy: string): Promise<Expense | null> {
    const expense = await this.getExpense(userId, expenseId)
    if (!expense) return null
    const patch: Partial<Expense> = { approvalStatus: 'rejected', approvedBy: rejectedBy }
    await this.updateExpense(userId, expenseId, patch)
    void FinanceEvents.emit('expense:rejected', userId, { expenseId, rejectedBy })
    return { ...expense, ...patch, updatedAt: new Date().toISOString() }
  }

  async markReimbursed(userId: string, expenseId: string): Promise<void> {
    await this.updateExpense(userId, expenseId, { approvalStatus: 'reimbursed' })
  }

  async listRecurringExpenses(userId: string): Promise<Expense[]> {
    const snap = await this.db.collection(COL(userId)).where('recurrence', '!=', 'none').get()
    return snap.docs.map((d) => d.data() as Expense)
  }
}
