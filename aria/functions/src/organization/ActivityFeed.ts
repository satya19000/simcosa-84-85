import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { ActivityEventType, ActivityRecord } from './WorkspaceTypes'
import { WorkspaceEvents } from './WorkspaceEvents'

const COL = (organizationId: string) => `organizations/${organizationId}/activity`

/**
 * Repository for organizations/{organizationId}/activity/{activityId}.
 * Owns ALL raw Firestore access for this collection, and emits the
 * corresponding in-process WorkspaceEvents entry alongside each write.
 *
 * Foundation-only: this writes Firestore documents that a client can read
 * via listActivity() (poll-based). There is no live onSnapshot listener
 * wired here — see README "Future Phase TODO" for real-time push.
 */
export class ActivityFeed {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async record(
    organizationId: string,
    actorId: string,
    type: ActivityEventType,
    summary: string,
    opts: { workspaceId?: string | null; targetId?: string | null; metadata?: Record<string, unknown> } = {}
  ): Promise<ActivityRecord> {
    const activityId = uuidv4()
    const now = new Date().toISOString()
    const record: ActivityRecord = {
      id: activityId,
      organizationId,
      activityId,
      type,
      actorId,
      summary,
      workspaceId: opts.workspaceId ?? null,
      targetId: opts.targetId ?? null,
      metadata: opts.metadata ?? {},
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(COL(organizationId)).doc(activityId).set(record)
    WorkspaceEvents.emit(type, { organizationId, type, actorId, activity: record })
    return record
  }

  async list(organizationId: string, limit = 50): Promise<ActivityRecord[]> {
    const snap = await this.db
      .collection(COL(organizationId))
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map((d) => d.data() as ActivityRecord)
  }

  async listForWorkspace(organizationId: string, workspaceId: string, limit = 50): Promise<ActivityRecord[]> {
    const snap = await this.db
      .collection(COL(organizationId))
      .where('workspaceId', '==', workspaceId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map((d) => d.data() as ActivityRecord)
  }

  async count(organizationId: string): Promise<number> {
    const snap = await this.db.collection(COL(organizationId)).count().get()
    return snap.data().count
  }
}
