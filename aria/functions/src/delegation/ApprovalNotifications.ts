import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { ApprovalRequest } from './ApprovalTypes'

const COL = (userId: string) => `users/${userId}/approvalNotifications`

export type ApprovalNotificationType =
  | 'approval_required' | 'approval_expiring' | 'approval_completed'
  | 'approval_rejected' | 'execution_finished'

export interface ApprovalNotificationPayload {
  id: string
  userId: string
  requestId: string
  type: ApprovalNotificationType
  title: string
  body: string
  createdAt: string
  read: boolean
}

/**
 * Writes internal in-app notification records about the approval process
 * itself (e.g. "you have a pending approval", "this is expiring soon").
 * These are NOT external comms — they ARE the approval UX. This class never
 * sends email/WhatsApp/SMS; any external-facing action must itself go through
 * the Approval Engine as a separate, explicitly-approved request.
 */
export class ApprovalNotifications {
  constructor(private readonly db: admin.firestore.Firestore) {}

  private async write(userId: string, requestId: string, type: ApprovalNotificationType, title: string, body: string): Promise<ApprovalNotificationPayload> {
    const payload: ApprovalNotificationPayload = {
      id: uuidv4(),
      userId,
      requestId,
      type,
      title,
      body,
      createdAt: new Date().toISOString(),
      read: false,
    }
    await this.db.collection(COL(userId)).doc(payload.id).set(payload)
    return payload
  }

  async notifyApprovalRequired(request: ApprovalRequest): Promise<ApprovalNotificationPayload> {
    return this.write(
      request.userId, request.id, 'approval_required',
      `Approval required: ${request.title}`,
      `${request.summary} (risk ${request.riskScore}/100, level: ${request.approvalLevel})`
    )
  }

  async notifyApprovalExpiring(request: ApprovalRequest): Promise<ApprovalNotificationPayload> {
    return this.write(
      request.userId, request.id, 'approval_expiring',
      `Expiring soon: ${request.title}`,
      `This approval request expires at ${request.expiresAt}.`
    )
  }

  async notifyApprovalCompleted(request: ApprovalRequest): Promise<ApprovalNotificationPayload> {
    return this.write(
      request.userId, request.id, 'approval_completed',
      `Approved: ${request.title}`,
      `This request was approved and is ready for execution.`
    )
  }

  async notifyApprovalRejected(request: ApprovalRequest, reason?: string): Promise<ApprovalNotificationPayload> {
    return this.write(
      request.userId, request.id, 'approval_rejected',
      `Rejected: ${request.title}`,
      reason ? `This request was rejected: ${reason}` : 'This request was rejected.'
    )
  }

  async notifyExecutionFinished(request: ApprovalRequest, success: boolean, details?: string): Promise<ApprovalNotificationPayload> {
    return this.write(
      request.userId, request.id, 'execution_finished',
      success ? `Executed: ${request.title}` : `Execution failed: ${request.title}`,
      details ?? (success ? 'Execution completed successfully.' : 'Execution failed and was rolled back where possible.')
    )
  }

  async list(userId: string, limit = 100): Promise<ApprovalNotificationPayload[]> {
    const snap = await this.db.collection(COL(userId)).orderBy('createdAt', 'desc').limit(limit).get()
    return snap.docs.map((d) => d.data() as ApprovalNotificationPayload)
  }
}
