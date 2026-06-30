import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'

const COL = (userId: string) => `users/${userId}/approvalHistory`

export interface ApprovalHistoryEntry {
  id: string
  requestId: string
  action: string
  actor: string
  notes?: string
  details?: Record<string, unknown>
  at: string
}

export interface ApprovalHistoryFilters {
  requestId?: string
  action?: string
  limit?: number
}

/** Immutable audit log over users/{userId}/approvalHistory. Append-only. */
export class ApprovalHistory {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async record(userId: string, entry: Omit<ApprovalHistoryEntry, 'id' | 'at'>): Promise<ApprovalHistoryEntry> {
    const full: ApprovalHistoryEntry = {
      id: uuidv4(),
      at: new Date().toISOString(),
      ...entry,
    }
    await this.db.collection(COL(userId)).doc(full.id).set(full)
    return full
  }

  async listForRequest(userId: string, requestId: string): Promise<ApprovalHistoryEntry[]> {
    const snap = await this.db.collection(COL(userId)).where('requestId', '==', requestId).orderBy('at', 'asc').get()
    return snap.docs.map((d) => d.data() as ApprovalHistoryEntry)
  }

  async listAll(userId: string, filters: ApprovalHistoryFilters = {}): Promise<ApprovalHistoryEntry[]> {
    let query: admin.firestore.Query = this.db.collection(COL(userId))
    if (filters.action) query = query.where('action', '==', filters.action)
    query = query.orderBy('at', 'desc').limit(filters.limit ?? 100)
    const snap = await query.get()
    return snap.docs.map((d) => d.data() as ApprovalHistoryEntry)
  }
}
