import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { Payment, PaymentStatus } from './FinanceTypes'
import { FinanceEvents } from './FinanceEvents'
import { InvoiceManager } from './InvoiceManager'

const COL = (userId: string) => `users/${userId}/payments`

export class PaymentManager {
  private readonly invoices: InvoiceManager

  constructor(private readonly db: admin.firestore.Firestore) {
    this.invoices = new InvoiceManager(db)
  }

  async recordPayment(userId: string, fields: Omit<Payment, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
    const now = new Date().toISOString()
    const payment: Payment = { id: uuidv4(), userId, status: 'completed', ...fields, createdAt: now, updatedAt: now }
    await this.db.collection(COL(userId)).doc(payment.id).set(payment)
    if (payment.status === 'completed' && payment.invoiceId) {
      await this.invoices.markPaid(userId, payment.invoiceId)
    }
    if (payment.status === 'failed') {
      void FinanceEvents.emit('payment:failed', userId, { paymentId: payment.id })
    } else {
      void FinanceEvents.emit('payment:recorded', userId, { paymentId: payment.id })
    }
    return payment
  }

  async getPayment(userId: string, paymentId: string): Promise<Payment | null> {
    const snap = await this.db.collection(COL(userId)).doc(paymentId).get()
    return snap.exists ? (snap.data() as Payment) : null
  }

  async updatePayment(userId: string, paymentId: string, patch: Partial<Payment>): Promise<void> {
    await this.db.collection(COL(userId)).doc(paymentId).update({ ...patch, updatedAt: new Date().toISOString() })
  }

  async listPayments(userId: string, opts: { status?: PaymentStatus; invoiceId?: string; expenseId?: string } = {}): Promise<Payment[]> {
    let query: admin.firestore.Query = this.db.collection(COL(userId))
    if (opts.status) query = query.where('status', '==', opts.status)
    if (opts.invoiceId) query = query.where('invoiceId', '==', opts.invoiceId)
    if (opts.expenseId) query = query.where('expenseId', '==', opts.expenseId)
    const snap = await query.orderBy('paidAt', 'desc').get()
    return snap.docs.map((d) => d.data() as Payment)
  }

  async setMemoryNodeId(userId: string, paymentId: string, memoryNodeId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(paymentId).update({ memoryNodeId })
  }
}
