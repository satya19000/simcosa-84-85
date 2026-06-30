import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { ProcurementRequest, ProcurementStatus, Quotation } from './FinanceTypes'
import { FinanceEvents } from './FinanceEvents'

const COL = (userId: string) => `users/${userId}/procurementRequests`

export class ProcurementManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async createRequest(
    userId: string,
    fields: Omit<ProcurementRequest, 'id' | 'userId' | 'status' | 'quotations' | 'createdAt' | 'updatedAt'>
  ): Promise<ProcurementRequest> {
    const now = new Date().toISOString()
    const request: ProcurementRequest = {
      id: uuidv4(),
      userId,
      status: 'requested',
      quotations: [],
      ...fields,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(COL(userId)).doc(request.id).set(request)
    void FinanceEvents.emit('procurement:requested', userId, { requestId: request.id })
    return request
  }

  async getRequest(userId: string, requestId: string): Promise<ProcurementRequest | null> {
    const snap = await this.db.collection(COL(userId)).doc(requestId).get()
    return snap.exists ? (snap.data() as ProcurementRequest) : null
  }

  async updateRequest(userId: string, requestId: string, patch: Partial<ProcurementRequest>): Promise<void> {
    await this.db.collection(COL(userId)).doc(requestId).update({ ...patch, updatedAt: new Date().toISOString() })
  }

  async listRequests(userId: string, opts: { status?: ProcurementStatus } = {}): Promise<ProcurementRequest[]> {
    let query: admin.firestore.Query = this.db.collection(COL(userId))
    if (opts.status) query = query.where('status', '==', opts.status)
    const snap = await query.orderBy('createdAt', 'desc').get()
    return snap.docs.map((d) => d.data() as ProcurementRequest)
  }

  async setMemoryNodeId(userId: string, requestId: string, memoryNodeId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(requestId).update({ memoryNodeId })
  }

  async addQuotation(userId: string, requestId: string, quotation: Omit<Quotation, 'id' | 'submittedAt'>): Promise<ProcurementRequest | null> {
    const request = await this.getRequest(userId, requestId)
    if (!request) return null
    const newQuotation: Quotation = { id: uuidv4(), submittedAt: new Date().toISOString(), ...quotation }
    const quotations = [...request.quotations, newQuotation]
    const patch: Partial<ProcurementRequest> = {
      quotations,
      status: request.status === 'requested' || request.status === 'quotation_pending' ? 'quotation_received' : request.status,
    }
    await this.updateRequest(userId, requestId, patch)
    return { ...request, ...patch, updatedAt: new Date().toISOString() }
  }

  /** Returns quotations sorted ascending by amount (cheapest first). */
  async compareQuotations(userId: string, requestId: string): Promise<Quotation[]> {
    const request = await this.getRequest(userId, requestId)
    if (!request) return []
    return [...request.quotations].sort((a, b) => a.amount - b.amount)
  }

  async selectVendor(userId: string, requestId: string, vendorId: string): Promise<ProcurementRequest | null> {
    const request = await this.getRequest(userId, requestId)
    if (!request) return null
    const patch: Partial<ProcurementRequest> = { selectedVendorId: vendorId }
    await this.updateRequest(userId, requestId, patch)
    return { ...request, ...patch, updatedAt: new Date().toISOString() }
  }

  async issuePurchaseOrder(userId: string, requestId: string, purchaseOrderNumber: string): Promise<ProcurementRequest | null> {
    const request = await this.getRequest(userId, requestId)
    if (!request) return null
    const patch: Partial<ProcurementRequest> = { status: 'po_issued', purchaseOrderNumber }
    await this.updateRequest(userId, requestId, patch)
    void FinanceEvents.emit('procurement:po_issued', userId, { requestId, purchaseOrderNumber })
    return { ...request, ...patch, updatedAt: new Date().toISOString() }
  }

  async recordGoodsReceipt(userId: string, requestId: string): Promise<ProcurementRequest | null> {
    const request = await this.getRequest(userId, requestId)
    if (!request) return null
    const patch: Partial<ProcurementRequest> = { status: 'goods_received' }
    await this.updateRequest(userId, requestId, patch)
    return { ...request, ...patch, updatedAt: new Date().toISOString() }
  }

  async matchInvoice(userId: string, requestId: string, invoiceId: string): Promise<ProcurementRequest | null> {
    const request = await this.getRequest(userId, requestId)
    if (!request) return null
    const patch: Partial<ProcurementRequest> = { status: 'invoice_matched', invoiceId }
    await this.updateRequest(userId, requestId, patch)
    return { ...request, ...patch, updatedAt: new Date().toISOString() }
  }

  async approveRequest(userId: string, requestId: string, approvedBy: string): Promise<ProcurementRequest | null> {
    const request = await this.getRequest(userId, requestId)
    if (!request) return null
    const patch: Partial<ProcurementRequest> = { status: 'completed', approvedBy }
    await this.updateRequest(userId, requestId, patch)
    void FinanceEvents.emit('procurement:approved', userId, { requestId, approvedBy })
    return { ...request, ...patch, updatedAt: new Date().toISOString() }
  }

  async rejectRequest(userId: string, requestId: string, rejectedBy: string): Promise<ProcurementRequest | null> {
    const request = await this.getRequest(userId, requestId)
    if (!request) return null
    const patch: Partial<ProcurementRequest> = { status: 'rejected', approvedBy: rejectedBy }
    await this.updateRequest(userId, requestId, patch)
    return { ...request, ...patch, updatedAt: new Date().toISOString() }
  }
}
