import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { Invoice, InvoiceStatus } from './FinanceTypes'
import { FinanceEvents } from './FinanceEvents'

const COL = (userId: string) => `users/${userId}/invoices`

export class InvoiceManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async createInvoice(userId: string, fields: Omit<Invoice, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const now = new Date().toISOString()
    const invoice: Invoice = { id: uuidv4(), userId, status: 'draft', ...fields, createdAt: now, updatedAt: now }
    await this.db.collection(COL(userId)).doc(invoice.id).set(invoice)
    void FinanceEvents.emit('invoice:created', userId, { invoiceId: invoice.id })
    return invoice
  }

  async getInvoice(userId: string, invoiceId: string): Promise<Invoice | null> {
    const snap = await this.db.collection(COL(userId)).doc(invoiceId).get()
    return snap.exists ? (snap.data() as Invoice) : null
  }

  async updateInvoice(userId: string, invoiceId: string, patch: Partial<Invoice>): Promise<void> {
    await this.db.collection(COL(userId)).doc(invoiceId).update({ ...patch, updatedAt: new Date().toISOString() })
  }

  async listInvoices(userId: string, opts: { status?: InvoiceStatus; vendorId?: string } = {}): Promise<Invoice[]> {
    let query: admin.firestore.Query = this.db.collection(COL(userId))
    if (opts.status) query = query.where('status', '==', opts.status)
    if (opts.vendorId) query = query.where('vendorId', '==', opts.vendorId)
    const snap = await query.orderBy('dueDate', 'desc').get()
    return snap.docs.map((d) => d.data() as Invoice)
  }

  async setMemoryNodeId(userId: string, invoiceId: string, memoryNodeId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(invoiceId).update({ memoryNodeId })
  }

  async markPaid(userId: string, invoiceId: string): Promise<Invoice | null> {
    const invoice = await this.getInvoice(userId, invoiceId)
    if (!invoice) return null
    const patch: Partial<Invoice> = { status: 'paid', paidAt: new Date().toISOString() }
    await this.updateInvoice(userId, invoiceId, patch)
    void FinanceEvents.emit('invoice:paid', userId, { invoiceId })
    return { ...invoice, ...patch, updatedAt: new Date().toISOString() }
  }

  /** Scans for invoices past due that aren't paid/cancelled; flips status and emits alerts. */
  async detectOverdueInvoices(userId: string): Promise<Invoice[]> {
    const snap = await this.db.collection(COL(userId)).where('status', 'in', ['sent', 'approved']).get()
    const now = Date.now()
    const overdue: Invoice[] = []
    for (const doc of snap.docs) {
      const invoice = doc.data() as Invoice
      if (Date.parse(invoice.dueDate) < now) {
        await this.updateInvoice(userId, invoice.id, { status: 'overdue' })
        void FinanceEvents.emit('invoice:overdue', userId, { invoiceId: invoice.id })
        overdue.push({ ...invoice, status: 'overdue' })
      }
    }
    return overdue
  }
}
