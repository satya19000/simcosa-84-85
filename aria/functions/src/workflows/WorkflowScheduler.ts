import type * as admin from 'firebase-admin'
import type { WorkflowDefinition } from './Workflow'
import type { ScheduledTrigger } from './WorkflowTypes'

/**
 * Schedule metadata persisted to Firestore.
 * Cloud Scheduler (or processDueReminders) checks this periodically.
 *
 * Path: users/{userId}/workflowSchedules/{workflowId}
 */
export interface WorkflowSchedule {
  workflowId: string
  userId: string
  cron: string
  timezone: string
  enabled: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  createdAt: string
  updatedAt: string
}

/** Compute the next ISO datetime after `after` for a simple cron-like schedule. */
export function computeNextRun(cron: string, after: Date): Date | null {
  // Supported named schedules for built-in workflows
  const named: Record<string, (d: Date) => Date> = {
    '@daily': (d) => {
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      next.setHours(7, 0, 0, 0)
      return next
    },
    '@weekly': (d) => {
      const next = new Date(d)
      next.setDate(next.getDate() + (7 - next.getDay()))
      next.setHours(7, 0, 0, 0)
      return next
    },
    '@monthly': (d) => {
      const next = new Date(d)
      next.setMonth(next.getMonth() + 1, 1)
      next.setHours(7, 0, 0, 0)
      return next
    },
    '@morning': (d) => {
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      next.setHours(7, 0, 0, 0)
      return next
    },
    '@evening': (d) => {
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      next.setHours(20, 0, 0, 0)
      return next
    },
  }
  return named[cron]?.(after) ?? null
}

export class WorkflowScheduler {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async upsert(userId: string, definition: WorkflowDefinition): Promise<void> {
    if (definition.trigger.type !== 'scheduled') return
    const trigger = definition.trigger as ScheduledTrigger
    const now = new Date()
    const nextRun = computeNextRun(trigger.cron, now)

    const schedule: WorkflowSchedule = {
      workflowId: definition.id,
      userId,
      cron: trigger.cron,
      timezone: trigger.timezone ?? 'UTC',
      enabled: definition.enabled,
      lastRunAt: null,
      nextRunAt: nextRun?.toISOString() ?? null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }

    await this.db
      .collection('users')
      .doc(userId)
      .collection('workflowSchedules')
      .doc(definition.id)
      .set(schedule, { merge: true })
  }

  async markRan(userId: string, workflowId: string): Promise<void> {
    const now = new Date()
    const snap = await this.db
      .collection('users').doc(userId).collection('workflowSchedules').doc(workflowId).get()
    const schedule = snap.data() as WorkflowSchedule | undefined
    const nextRun = schedule ? computeNextRun(schedule.cron, now) : null

    await this.db
      .collection('users').doc(userId).collection('workflowSchedules').doc(workflowId)
      .set({ lastRunAt: now.toISOString(), nextRunAt: nextRun?.toISOString() ?? null, updatedAt: now.toISOString() }, { merge: true })
  }

  async getDue(userId: string): Promise<WorkflowSchedule[]> {
    const now = new Date().toISOString()
    const snap = await this.db
      .collection('users').doc(userId).collection('workflowSchedules')
      .where('enabled', '==', true)
      .where('nextRunAt', '<=', now)
      .get()
    return snap.docs.map((d) => d.data() as WorkflowSchedule)
  }

  async setEnabled(userId: string, workflowId: string, enabled: boolean): Promise<void> {
    await this.db
      .collection('users').doc(userId).collection('workflowSchedules').doc(workflowId)
      .set({ enabled, updatedAt: new Date().toISOString() }, { merge: true })
  }

  async list(userId: string): Promise<WorkflowSchedule[]> {
    const snap = await this.db
      .collection('users').doc(userId).collection('workflowSchedules')
      .orderBy('nextRunAt', 'asc')
      .get()
    return snap.docs.map((d) => d.data() as WorkflowSchedule)
  }
}
