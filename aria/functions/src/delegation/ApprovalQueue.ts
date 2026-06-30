import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { ApprovalLevel, ApprovalRequest, ApprovalStatus, ApprovalTriggerType } from './ApprovalTypes'
import { ApprovalEvents } from './ApprovalEvents'

const COL = (userId: string) => `users/${userId}/approvalRequests`

export interface ApprovalListFilters {
  status?: ApprovalStatus
  approvalLevel?: ApprovalLevel
  triggerType?: ApprovalTriggerType
  search?: string
  limit?: number
}

/**
 * Firestore-backed repository over users/{userId}/approvalRequests.
 * NEVER executes anything — this class only manages approval state. Every
 * transition appends a history entry and emits the matching ApprovalEvents
 * event; actual side effects (sending email, deleting records, etc.) live in
 * ApprovalRegistry executors, invoked only by ApprovalEngine after a request
 * has genuinely reached status 'approved'.
 */
export class ApprovalQueue {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async create(request: ApprovalRequest): Promise<ApprovalRequest> {
    await this.db.collection(COL(request.userId)).doc(request.id).set(request)
    void ApprovalEvents.emit('approval:created', request.userId, { requestId: request.id, triggerType: request.triggerType, riskScore: request.riskScore })
    return request
  }

  async get(userId: string, id: string): Promise<ApprovalRequest | null> {
    const snap = await this.db.collection(COL(userId)).doc(id).get()
    return snap.exists ? (snap.data() as ApprovalRequest) : null
  }

  async update(userId: string, id: string, patch: Partial<ApprovalRequest>): Promise<void> {
    await this.db.collection(COL(userId)).doc(id).update({
      ...patch,
      updatedAt: new Date().toISOString(),
    })
  }

  async list(userId: string, filters: ApprovalListFilters = {}): Promise<ApprovalRequest[]> {
    let query: admin.firestore.Query = this.db.collection(COL(userId))
    if (filters.status) query = query.where('status', '==', filters.status)
    if (filters.approvalLevel) query = query.where('approvalLevel', '==', filters.approvalLevel)
    if (filters.triggerType) query = query.where('triggerType', '==', filters.triggerType)
    const snap = await query.limit(filters.limit ?? 200).get()
    let results = snap.docs.map((d) => d.data() as ApprovalRequest)
    if (filters.search) {
      const term = filters.search.toLowerCase()
      results = results.filter((r) => r.title.toLowerCase().includes(term))
    }
    // Priority sort: highest risk first, then soonest-expiring first.
    results.sort((a, b) => b.riskScore - a.riskScore || Date.parse(a.expiresAt) - Date.parse(b.expiresAt))
    return results
  }

  async listPending(userId: string): Promise<ApprovalRequest[]> {
    return this.list(userId, { status: 'pending' })
  }

  async listUrgent(userId: string, withinMs = 2 * 60 * 60 * 1000): Promise<ApprovalRequest[]> {
    const pending = await this.listPending(userId)
    const now = Date.now()
    return pending.filter((r) => Date.parse(r.expiresAt) - now <= withinMs && Date.parse(r.expiresAt) - now > 0)
  }

  async listExpired(userId: string): Promise<ApprovalRequest[]> {
    return this.list(userId, { status: 'expired' })
  }

  private async appendHistory(userId: string, id: string, action: ApprovalRequest['history'][number]['action'], actor: string, notes?: string): Promise<void> {
    const request = await this.get(userId, id)
    if (!request) return
    const entry = { id: uuidv4(), action, actor, notes, at: new Date().toISOString() }
    await this.update(userId, id, { history: [...request.history, entry] })
  }

  async approve(userId: string, id: string, approvedBy: string): Promise<ApprovalRequest | null> {
    const request = await this.get(userId, id)
    if (!request) return null
    await this.update(userId, id, { status: 'approved' })
    await this.appendHistory(userId, id, 'approved', approvedBy)
    void ApprovalEvents.emit('approval:approved', userId, { requestId: id, approvedBy })
    return this.get(userId, id)
  }

  async reject(userId: string, id: string, rejectedBy: string, reason?: string): Promise<ApprovalRequest | null> {
    const request = await this.get(userId, id)
    if (!request) return null
    await this.update(userId, id, { status: 'rejected' })
    await this.appendHistory(userId, id, 'rejected', rejectedBy, reason)
    void ApprovalEvents.emit('approval:rejected', userId, { requestId: id, rejectedBy, reason })
    return this.get(userId, id)
  }

  async cancel(userId: string, id: string, cancelledBy: string, reason?: string): Promise<ApprovalRequest | null> {
    const request = await this.get(userId, id)
    if (!request) return null
    await this.update(userId, id, { status: 'cancelled' })
    await this.appendHistory(userId, id, 'cancelled', cancelledBy, reason)
    void ApprovalEvents.emit('approval:cancelled', userId, { requestId: id, cancelledBy, reason })
    return this.get(userId, id)
  }

  async markExpired(userId: string, id: string): Promise<ApprovalRequest | null> {
    const request = await this.get(userId, id)
    if (!request) return null
    await this.update(userId, id, { status: 'expired' })
    await this.appendHistory(userId, id, 'expired', 'system')
    void ApprovalEvents.emit('approval:expired', userId, { requestId: id })
    return this.get(userId, id)
  }

  async markExecuted(userId: string, id: string, executedBy: string): Promise<ApprovalRequest | null> {
    const request = await this.get(userId, id)
    if (!request) return null
    const executedAt = new Date().toISOString()
    await this.update(userId, id, { status: 'executed', executedAt })
    await this.appendHistory(userId, id, 'executed', executedBy)
    void ApprovalEvents.emit('approval:executed', userId, { requestId: id, executedAt })
    return this.get(userId, id)
  }

  async markRolledBack(userId: string, id: string, rolledBackBy: string, reason?: string): Promise<ApprovalRequest | null> {
    const request = await this.get(userId, id)
    if (!request) return null
    const rolledBackAt = new Date().toISOString()
    await this.update(userId, id, { status: 'rolled_back', rolledBackAt })
    await this.appendHistory(userId, id, 'rolled_back', rolledBackBy, reason)
    void ApprovalEvents.emit('approval:rolled_back', userId, { requestId: id, rolledBackAt, reason })
    return this.get(userId, id)
  }

  async delegate(userId: string, id: string, delegatedTo: string, delegatedBy: string): Promise<ApprovalRequest | null> {
    const request = await this.get(userId, id)
    if (!request) return null
    await this.update(userId, id, { status: 'delegated', delegatedTo })
    await this.appendHistory(userId, id, 'delegated', delegatedBy, `delegated to ${delegatedTo}`)
    void ApprovalEvents.emit('approval:delegated', userId, { requestId: id, delegatedTo, delegatedBy })
    return this.get(userId, id)
  }

  async bulkApprove(userId: string, ids: string[], approvedBy: string): Promise<ApprovalRequest[]> {
    const results: ApprovalRequest[] = []
    for (const id of ids) {
      const r = await this.approve(userId, id, approvedBy)
      if (r) results.push(r)
    }
    return results
  }

  async bulkReject(userId: string, ids: string[], rejectedBy: string, reason?: string): Promise<ApprovalRequest[]> {
    const results: ApprovalRequest[] = []
    for (const id of ids) {
      const r = await this.reject(userId, id, rejectedBy, reason)
      if (r) results.push(r)
    }
    return results
  }
}
