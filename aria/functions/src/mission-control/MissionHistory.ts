import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { MissionHistoryEntry } from './MissionTypes'

const COL = (userId: string) => `users/${userId}/missionHistory`

export interface MissionHistoryFilters {
  requestId?: string
  action?: string
  limit?: number
}

/** Append-only, durable, queryable, cross-mission audit log — mirrors ApprovalHistory.ts exactly. */
export class MissionHistory {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async append(userId: string, entry: Omit<MissionHistoryEntry, 'id' | 'at'>): Promise<MissionHistoryEntry> {
    const full: MissionHistoryEntry = {
      id: uuidv4(),
      at: new Date().toISOString(),
      ...entry,
    }
    await this.db.collection(COL(userId)).doc(full.id).set(full)
    return full
  }

  async listForRequest(userId: string, requestId: string): Promise<MissionHistoryEntry[]> {
    const snap = await this.db.collection(COL(userId)).where('requestId', '==', requestId).orderBy('at', 'asc').get()
    return snap.docs.map((d) => d.data() as MissionHistoryEntry)
  }

  async listAll(userId: string, filters: MissionHistoryFilters = {}): Promise<MissionHistoryEntry[]> {
    let query: FirebaseFirestore.Query = this.db.collection(COL(userId))
    if (filters.action) query = query.where('action', '==', filters.action)
    query = query.orderBy('at', 'desc').limit(filters.limit ?? 200)
    const snap = await query.get()
    return snap.docs.map((d) => d.data() as MissionHistoryEntry)
  }
}
