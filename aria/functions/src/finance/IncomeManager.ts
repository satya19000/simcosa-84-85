import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { Income } from './FinanceTypes'
import { FinanceEvents } from './FinanceEvents'

const COL = (userId: string) => `users/${userId}/income`

export class IncomeManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async recordIncome(userId: string, fields: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Income> {
    const now = new Date().toISOString()
    const income: Income = { id: uuidv4(), userId, ...fields, createdAt: now, updatedAt: now }
    await this.db.collection(COL(userId)).doc(income.id).set(income)
    void FinanceEvents.emit('income:recorded', userId, { incomeId: income.id })
    return income
  }

  async getIncome(userId: string, incomeId: string): Promise<Income | null> {
    const snap = await this.db.collection(COL(userId)).doc(incomeId).get()
    return snap.exists ? (snap.data() as Income) : null
  }

  async updateIncome(userId: string, incomeId: string, patch: Partial<Income>): Promise<void> {
    await this.db.collection(COL(userId)).doc(incomeId).update({ ...patch, updatedAt: new Date().toISOString() })
  }

  async listIncome(userId: string, opts: { category?: Income['category']; fundingSourceId?: string } = {}): Promise<Income[]> {
    let query: admin.firestore.Query = this.db.collection(COL(userId))
    if (opts.category) query = query.where('category', '==', opts.category)
    if (opts.fundingSourceId) query = query.where('fundingSourceId', '==', opts.fundingSourceId)
    const snap = await query.orderBy('receivedAt', 'desc').get()
    return snap.docs.map((d) => d.data() as Income)
  }
}
