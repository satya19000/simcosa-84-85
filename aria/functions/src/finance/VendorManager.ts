import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { Vendor, VendorStatus } from './FinanceTypes'
import { FinanceEvents } from './FinanceEvents'

const COL = (userId: string) => `users/${userId}/vendors`

export class VendorManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async createVendor(userId: string, fields: Omit<Vendor, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Vendor> {
    const now = new Date().toISOString()
    const vendor: Vendor = { id: uuidv4(), userId, status: 'active', ...fields, createdAt: now, updatedAt: now }
    await this.db.collection(COL(userId)).doc(vendor.id).set(vendor)
    void FinanceEvents.emit('vendor:created', userId, { vendorId: vendor.id })
    return vendor
  }

  async getVendor(userId: string, vendorId: string): Promise<Vendor | null> {
    const snap = await this.db.collection(COL(userId)).doc(vendorId).get()
    return snap.exists ? (snap.data() as Vendor) : null
  }

  async updateVendor(userId: string, vendorId: string, patch: Partial<Vendor>): Promise<void> {
    await this.db.collection(COL(userId)).doc(vendorId).update({ ...patch, updatedAt: new Date().toISOString() })
  }

  async listVendors(userId: string, opts: { status?: VendorStatus } = {}): Promise<Vendor[]> {
    let query: admin.firestore.Query = this.db.collection(COL(userId))
    if (opts.status) query = query.where('status', '==', opts.status)
    const snap = await query.orderBy('name').get()
    return snap.docs.map((d) => d.data() as Vendor)
  }

  async searchVendors(userId: string, term: string): Promise<Vendor[]> {
    const all = await this.listVendors(userId)
    const lower = term.toLowerCase()
    return all.filter((v) => v.name.toLowerCase().includes(lower))
  }

  async setMemoryNodeId(userId: string, vendorId: string, memoryNodeId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(vendorId).update({ memoryNodeId })
  }

  async evaluateVendor(userId: string, vendorId: string, rating: number, note?: string): Promise<Vendor | null> {
    const vendor = await this.getVendor(userId, vendorId)
    if (!vendor) return null
    const evaluationNotes = note ? [...(vendor.evaluationNotes ?? []), note] : vendor.evaluationNotes
    const patch: Partial<Vendor> = { rating, evaluationNotes }
    await this.updateVendor(userId, vendorId, patch)
    void FinanceEvents.emit('vendor:evaluated', userId, { vendorId, rating })
    return { ...vendor, ...patch, updatedAt: new Date().toISOString() }
  }
}
