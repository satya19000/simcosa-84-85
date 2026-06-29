import type * as admin from 'firebase-admin'
import type { WorkflowResult } from './WorkflowResult'
import type { WorkflowStatus } from './WorkflowTypes'

/**
 * Persists and retrieves workflow execution history.
 * Path: users/{userId}/workflowHistory/{executionId}
 */
export class WorkflowHistory {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async save(userId: string, result: WorkflowResult): Promise<void> {
    await this.db
      .collection('users')
      .doc(userId)
      .collection('workflowHistory')
      .doc(result.executionId)
      .set({
        ...result,
        savedAt: new Date().toISOString(),
      })
  }

  async get(userId: string, executionId: string): Promise<WorkflowResult | null> {
    const snap = await this.db
      .collection('users')
      .doc(userId)
      .collection('workflowHistory')
      .doc(executionId)
      .get()
    return snap.exists ? (snap.data() as WorkflowResult) : null
  }

  async list(
    userId: string,
    opts?: {
      workflowId?: string
      status?: WorkflowStatus
      limit?: number
    }
  ): Promise<WorkflowResult[]> {
    let q: admin.firestore.Query = this.db
      .collection('users')
      .doc(userId)
      .collection('workflowHistory')
      .orderBy('startedAt', 'desc')

    if (opts?.workflowId) q = q.where('workflowId', '==', opts.workflowId)
    if (opts?.status) q = q.where('status', '==', opts.status)
    q = q.limit(opts?.limit ?? 50)

    const snap = await q.get()
    return snap.docs.map((d) => d.data() as WorkflowResult)
  }

  async deleteOlderThan(userId: string, days: number): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const snap = await this.db
      .collection('users')
      .doc(userId)
      .collection('workflowHistory')
      .where('startedAt', '<', cutoff)
      .limit(100)
      .get()

    const batch = this.db.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    return snap.size
  }
}
