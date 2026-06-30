import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { Budget, BudgetPeriod, BudgetStatus } from './FinanceTypes'
import { FinanceEvents } from './FinanceEvents'

const COL = (userId: string) => `users/${userId}/budgets`

export class BudgetManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async createBudget(
    userId: string,
    fields: Omit<Budget, 'id' | 'userId' | 'status' | 'spent' | 'createdAt' | 'updatedAt'>
  ): Promise<Budget> {
    const now = new Date().toISOString()
    const budget: Budget = {
      id: uuidv4(),
      userId,
      status: 'active',
      spent: 0,
      ...fields,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(COL(userId)).doc(budget.id).set(budget)
    void FinanceEvents.emit('budget:created', userId, { budgetId: budget.id })
    return budget
  }

  async getBudget(userId: string, budgetId: string): Promise<Budget | null> {
    const snap = await this.db.collection(COL(userId)).doc(budgetId).get()
    return snap.exists ? (snap.data() as Budget) : null
  }

  async updateBudget(userId: string, budgetId: string, patch: Partial<Budget>): Promise<void> {
    await this.db.collection(COL(userId)).doc(budgetId).update({
      ...patch,
      updatedAt: new Date().toISOString(),
    })
  }

  async listBudgets(userId: string, opts: { period?: BudgetPeriod; status?: BudgetStatus } = {}): Promise<Budget[]> {
    let query: admin.firestore.Query = this.db.collection(COL(userId))
    if (opts.period) query = query.where('period', '==', opts.period)
    if (opts.status) query = query.where('status', '==', opts.status)
    const snap = await query.orderBy('startDate', 'desc').get()
    return snap.docs.map((d) => d.data() as Budget)
  }

  async setMemoryNodeId(userId: string, budgetId: string, memoryNodeId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(budgetId).update({ memoryNodeId })
  }

  /** Increments spend, flips status/emits alerts when thresholds are crossed. */
  async recordSpend(userId: string, budgetId: string, amount: number): Promise<Budget | null> {
    const budget = await this.getBudget(userId, budgetId)
    if (!budget) return null
    const spent = budget.spent + amount
    const patch: Partial<Budget> = { spent }
    const threshold = budget.alertThresholdPct ?? 90
    if (spent >= budget.amount) {
      patch.status = 'over_budget'
      void FinanceEvents.emit('budget:exceeded', userId, { budgetId, spent, amount: budget.amount })
    } else if (budget.amount > 0 && (spent / budget.amount) * 100 >= threshold) {
      void FinanceEvents.emit('budget:alert', userId, { budgetId, spent, amount: budget.amount, threshold })
    }
    await this.updateBudget(userId, budgetId, patch)
    return { ...budget, ...patch, updatedAt: new Date().toISOString() }
  }

  async remainingBudget(userId: string, budgetId: string): Promise<number | null> {
    const budget = await this.getBudget(userId, budgetId)
    if (!budget) return null
    return budget.amount - budget.spent
  }

  /** Simple linear forecast based on elapsed-time vs spend ratio. */
  async forecastBudget(userId: string, budgetId: string): Promise<{ projectedTotal: number; willExceed: boolean } | null> {
    const budget = await this.getBudget(userId, budgetId)
    if (!budget) return null
    const start = Date.parse(budget.startDate)
    const end = Date.parse(budget.endDate)
    const now = Date.now()
    const elapsedFraction = end > start ? Math.min(1, Math.max(0, (now - start) / (end - start))) : 1
    const projectedTotal = elapsedFraction > 0 ? budget.spent / elapsedFraction : budget.spent
    return { projectedTotal, willExceed: projectedTotal > budget.amount }
  }
}
