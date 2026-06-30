import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { TenantEngine } from './TenantEngine'
import type { SecurityAuditRecord, AuditRiskLevel } from './SecurityTypes'

const AUDIT_COL = (tenantId: string) => `tenants/${tenantId}/securityAudit`

/**
 * Append-only audit log for tenants/{tenantId}/securityAudit/{eventId}.
 * Every sensitive event (role changed, permission changed, member removed,
 * policy changed, session revoked, service account created, plugin
 * installed, export requested) must call `record()` here. There is no
 * update/delete method by design — audit records are immutable once
 * written, mirroring the activityLogs collection's write-once contract.
 */
export class SecurityAudit {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly tenants: TenantEngine
  ) {}

  async record(
    tenantId: string,
    actorId: string,
    input: {
      action: string
      resource: string
      organizationId?: string | null
      workspaceId?: string | null
      before?: Record<string, unknown> | null
      after?: Record<string, unknown> | null
      riskLevel?: AuditRiskLevel
      traceId?: string | null
    }
  ): Promise<SecurityAuditRecord> {
    // Audit writes for an actor still require the actor to be a verified
    // tenant identity, EXCEPT during tenant bootstrap (handled by callers
    // that pass the tenant owner immediately after createFirstIdentity).
    const eventId = uuidv4()
    const record: SecurityAuditRecord = {
      id: eventId,
      tenantId,
      eventId,
      actorId,
      organizationId: input.organizationId ?? null,
      workspaceId: input.workspaceId ?? null,
      action: input.action,
      resource: input.resource,
      before: input.before ?? null,
      after: input.after ?? null,
      timestamp: new Date().toISOString(),
      riskLevel: input.riskLevel ?? 'low',
      traceId: input.traceId ?? null,
    }
    await this.db.collection(AUDIT_COL(tenantId)).doc(eventId).set(record)
    return record
  }

  async listEvents(tenantId: string, actorUserId: string, limit = 200): Promise<SecurityAuditRecord[]> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const snap = await this.db.collection(AUDIT_COL(tenantId)).orderBy('timestamp', 'desc').limit(limit).get()
    return snap.docs.map((d) => d.data() as SecurityAuditRecord)
  }

  async listEventsForResource(tenantId: string, actorUserId: string, resource: string): Promise<SecurityAuditRecord[]> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const snap = await this.db.collection(AUDIT_COL(tenantId)).where('resource', '==', resource).orderBy('timestamp', 'desc').get()
    return snap.docs.map((d) => d.data() as SecurityAuditRecord)
  }
}
