import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { TenantEngine } from '../security/TenantEngine'
import type { LocalAgentRegistration } from './ComputerTypes'
import type { ComputerAudit } from './ComputerAudit'

const AGENT_COL = (tenantId: string) => `tenants/${tenantId}/computerAgents`

/**
 * LocalBridge — Architecture/placeholder for the Local Desktop Agent handshake.
 *
 * NOT IMPLEMENTED: No native app, no binary, no installer exists.
 * All methods return placeholder registration records and are explicitly
 * documented as architecture stubs for future implementation.
 *
 * Future design:
 * - A local agent binary would run on the user's machine.
 * - It would register here with a deviceId, publicKey, and capabilityGrant.
 * - Heartbeat calls would maintain health status.
 * - All capability execution would still go through the approval bridge.
 *
 * Tenant membership is verified before every operation.
 */
export class LocalBridge {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly tenants: TenantEngine,
    private readonly audit: ComputerAudit
  ) {}

  /**
   * Register a local agent. PLACEHOLDER — no verification of the publicKey or
   * agent binary is performed. Returns a registration record for the UI to display.
   */
  async registerLocalAgent(
    tenantId: string,
    userId: string,
    input: {
      deviceId: string
      publicKey: string
      capabilityGrant: LocalAgentRegistration['capabilityGrant']
    }
  ): Promise<LocalAgentRegistration> {
    await this.tenants.requireIdentity(tenantId, userId)

    const agentId = uuidv4()
    const now = new Date().toISOString()
    const registration: LocalAgentRegistration = {
      agentId,
      deviceId: input.deviceId,
      userId,
      tenantId,
      publicKey: input.publicKey,
      sessionId: null,
      capabilityGrant: input.capabilityGrant,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      revokedAt: null,
      healthStatus: 'unknown',
      registeredAt: now,
      updatedAt: now,
      _placeholder: true,
    }

    await this.db.collection(AGENT_COL(tenantId)).doc(agentId).set(registration)

    await this.audit.record({
      tenantId,
      userId,
      eventType: 'agent.registered',
      agentId,
      metadata: { deviceId: input.deviceId, placeholder: true },
    })

    return registration
  }

  async revokeLocalAgent(tenantId: string, userId: string, agentId: string): Promise<void> {
    await this.tenants.requireIdentity(tenantId, userId)
    const ref = this.db.collection(AGENT_COL(tenantId)).doc(agentId)
    await ref.update({ revokedAt: new Date().toISOString(), healthStatus: 'unreachable', updatedAt: new Date().toISOString() })
    await this.audit.record({ tenantId, userId, eventType: 'agent.revoked', agentId, metadata: {} })
  }

  async listLocalAgents(tenantId: string, userId: string): Promise<LocalAgentRegistration[]> {
    await this.tenants.requireIdentity(tenantId, userId)
    const snap = await this.db.collection(AGENT_COL(tenantId)).where('userId', '==', userId).get()
    return snap.docs.map((d) => d.data() as LocalAgentRegistration)
  }

  async heartbeatLocalAgent(tenantId: string, userId: string, agentId: string): Promise<LocalAgentRegistration | null> {
    await this.tenants.requireIdentity(tenantId, userId)
    const ref = this.db.collection(AGENT_COL(tenantId)).doc(agentId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ healthStatus: 'healthy', updatedAt: new Date().toISOString() })
    return (await ref.get()).data() as LocalAgentRegistration
  }
}
