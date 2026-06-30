import { ApprovalHistory } from './ApprovalHistory'

export interface ApprovalLogEntry {
  actor: string
  action: string
  requestId: string
  details?: Record<string, unknown>
  notes?: string
}

/**
 * Structured audit logger wrapping ApprovalHistory.record with a consistent
 * shape. ApprovalEngine calls this for every consequential action (approve,
 * reject, execute, rollback, delegate, expire, cancel) so the audit trail is
 * uniform regardless of which code path triggered the transition.
 */
export class ApprovalLogger {
  constructor(private readonly history: ApprovalHistory) {}

  async log(userId: string, entry: ApprovalLogEntry): Promise<void> {
    await this.history.record(userId, {
      requestId: entry.requestId,
      action: entry.action,
      actor: entry.actor,
      notes: entry.notes,
      details: entry.details,
    })
  }
}
