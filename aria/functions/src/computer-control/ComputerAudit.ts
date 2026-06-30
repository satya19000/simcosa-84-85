import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { ComputerAuditEvent, ComputerAuditEventType, ComputerCapabilityId, ComputerRiskLevel } from './ComputerTypes'

const AUDIT_COL = (tenantId: string) => `tenants/${tenantId}/computerAudit`

/**
 * Append-only audit log for all computer-control actions.
 * Observability events logged: action planned, action approved, action blocked,
 * action executed, capability denied, safety guard triggered, agent registered,
 * agent revoked, extension registered, extension revoked.
 *
 * Sensitive content is NEVER logged — only metadata identifiers and risk levels.
 */
export class ComputerAudit {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async record(params: {
    tenantId: string
    userId: string
    eventType: ComputerAuditEventType
    capabilityId?: ComputerCapabilityId
    planId?: string
    sessionId?: string
    agentId?: string
    extensionId?: string
    approvalRequestId?: string
    riskLevel?: ComputerRiskLevel
    metadata?: Record<string, unknown>
  }): Promise<ComputerAuditEvent> {
    const auditId = uuidv4()
    const event: ComputerAuditEvent = {
      auditId,
      tenantId: params.tenantId,
      userId: params.userId,
      eventType: params.eventType,
      capabilityId: params.capabilityId,
      planId: params.planId,
      sessionId: params.sessionId,
      agentId: params.agentId,
      extensionId: params.extensionId,
      approvalRequestId: params.approvalRequestId,
      riskLevel: params.riskLevel,
      metadata: params.metadata ?? {},
      timestamp: new Date().toISOString(),
    }
    await this.db.collection(AUDIT_COL(params.tenantId)).doc(auditId).set(event)
    return event
  }

  async listRecent(tenantId: string, limit = 50): Promise<ComputerAuditEvent[]> {
    const snap = await this.db
      .collection(AUDIT_COL(tenantId))
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map((d) => d.data() as ComputerAuditEvent)
  }
}
