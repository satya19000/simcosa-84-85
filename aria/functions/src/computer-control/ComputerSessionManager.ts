import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { TenantEngine } from '../security/TenantEngine'
import type { ComputerSession, ComputerCapabilityId } from './ComputerTypes'

const SESSION_COL = (tenantId: string) => `tenants/${tenantId}/computerSessions`
const SESSION_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Repository for computer-control sessions.
 * Sessions scope capability grants and approval references for a single
 * user interaction with the computer-control subsystem.
 */
export class ComputerSessionManager {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly tenants: TenantEngine
  ) {}

  async createSession(
    tenantId: string,
    userId: string,
    capabilities: ComputerCapabilityId[],
    deviceId: string | null = null
  ): Promise<ComputerSession> {
    await this.tenants.requireIdentity(tenantId, userId)
    const sessionId = uuidv4()
    const now = new Date()
    const session: ComputerSession = {
      sessionId,
      userId,
      tenantId,
      deviceId,
      startedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
      status: 'active',
      capabilities,
      approvals: [],
      auditTrail: [],
    }
    await this.db.collection(SESSION_COL(tenantId)).doc(sessionId).set(session)
    return session
  }

  async getSession(tenantId: string, sessionId: string): Promise<ComputerSession | null> {
    const snap = await this.db.collection(SESSION_COL(tenantId)).doc(sessionId).get()
    if (!snap.exists) return null
    const session = snap.data() as ComputerSession
    // Expire stale sessions
    if (new Date(session.expiresAt) < new Date() && session.status === 'active') {
      await snap.ref.update({ status: 'expired' })
      return { ...session, status: 'expired' }
    }
    return session
  }

  async revokeSession(tenantId: string, userId: string, sessionId: string): Promise<void> {
    await this.tenants.requireIdentity(tenantId, userId)
    await this.db.collection(SESSION_COL(tenantId)).doc(sessionId).update({
      status: 'revoked',
    })
  }

  async addApproval(tenantId: string, sessionId: string, approvalRequestId: string): Promise<void> {
    const ref = this.db.collection(SESSION_COL(tenantId)).doc(sessionId)
    const snap = await ref.get()
    if (!snap.exists) return
    const session = snap.data() as ComputerSession
    await ref.update({ approvals: [...session.approvals, approvalRequestId] })
  }

  async addAuditEvent(tenantId: string, sessionId: string, auditId: string): Promise<void> {
    const ref = this.db.collection(SESSION_COL(tenantId)).doc(sessionId)
    const snap = await ref.get()
    if (!snap.exists) return
    const session = snap.data() as ComputerSession
    await ref.update({ auditTrail: [...session.auditTrail, auditId] })
  }
}
