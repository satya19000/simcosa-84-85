import type * as admin from 'firebase-admin'
import type { TenantEngine } from '../security/TenantEngine'
import type { RBACEngine } from '../security/RBACEngine'
import type { ComputerCapabilityId } from './ComputerTypes'
import type { ComputerCapabilityRegistry } from './ComputerCapabilityRegistry'

const POLICY_COL = (tenantId: string) => `tenants/${tenantId}/computerPolicies`

export interface ComputerPolicy {
  id: string
  tenantId: string
  allowedCapabilities: ComputerCapabilityId[]
  blockedCapabilities: ComputerCapabilityId[]
  requireApprovalForAll: boolean
  /** paymentAction is blocked by default at policy level. */
  paymentActionBlocked: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

/**
 * Policy engine for computer-control capability grants.
 *
 * Policy invariants:
 * - credentialAccess is never in allowedCapabilities — ComputerSafetyGuard
 *   blocks it unconditionally before policy is even checked.
 * - paymentAction defaults to blocked=true at the policy level.
 * - All policy reads/writes verify tenant membership first.
 */
export class ComputerPolicyEngine {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly tenants: TenantEngine,
    private readonly rbac: RBACEngine,
    private readonly capabilityRegistry: ComputerCapabilityRegistry
  ) {}

  async getPolicy(tenantId: string, userId: string): Promise<ComputerPolicy | null> {
    await this.tenants.requireIdentity(tenantId, userId)
    const snap = await this.db.collection(POLICY_COL(tenantId)).limit(1).get()
    if (snap.empty) return null
    return snap.docs[0].data() as ComputerPolicy
  }

  async getOrCreateDefaultPolicy(tenantId: string, userId: string): Promise<ComputerPolicy> {
    const existing = await this.getPolicy(tenantId, userId)
    if (existing) return existing
    return this.createDefaultPolicy(tenantId, userId)
  }

  private async createDefaultPolicy(tenantId: string, createdBy: string): Promise<ComputerPolicy> {
    const { v4: uuidv4 } = await import('uuid')
    const id = uuidv4()
    const now = new Date().toISOString()

    // Default: allow only the safest capabilities; block everything high-risk
    const safeDefaults: ComputerCapabilityId[] = [
      'readVisiblePage',
      'summarizeVisiblePage',
      'openUrl',
      'searchWeb',
      'copyToClipboard',
      'uploadFileWithUserPicker',
    ]

    const policy: ComputerPolicy = {
      id,
      tenantId,
      allowedCapabilities: safeDefaults,
      blockedCapabilities: ['credentialAccess', 'paymentAction'],
      requireApprovalForAll: false,
      paymentActionBlocked: true,
      createdBy,
      createdAt: now,
      updatedAt: now,
    }

    await this.db.collection(POLICY_COL(tenantId)).doc(id).set(policy)
    return policy
  }

  async updatePolicy(
    tenantId: string,
    userId: string,
    fields: Partial<Pick<ComputerPolicy, 'allowedCapabilities' | 'blockedCapabilities' | 'requireApprovalForAll' | 'paymentActionBlocked'>>
  ): Promise<ComputerPolicy> {
    await this.tenants.requireIdentity(tenantId, userId)
    await this.rbac.requirePermission(tenantId, userId, 'security.manage')

    // credentialAccess must never appear in allowedCapabilities
    if (fields.allowedCapabilities) {
      fields.allowedCapabilities = fields.allowedCapabilities.filter((c) => c !== 'credentialAccess')
    }

    const existing = await this.getOrCreateDefaultPolicy(tenantId, userId)
    const updated: ComputerPolicy = {
      ...existing,
      ...fields,
      updatedAt: new Date().toISOString(),
    }
    await this.db.collection(POLICY_COL(tenantId)).doc(existing.id).set(updated)
    return updated
  }

  isCapabilityAllowedByPolicy(policy: ComputerPolicy, capabilityId: ComputerCapabilityId): boolean {
    // credentialAccess is NEVER allowed by policy
    if (capabilityId === 'credentialAccess') return false
    // paymentAction: check policy block flag
    if (capabilityId === 'paymentAction' && policy.paymentActionBlocked) return false
    if (policy.blockedCapabilities.includes(capabilityId)) return false
    const descriptor = this.capabilityRegistry.get(capabilityId)
    if (descriptor?.alwaysBlocked) return false
    if (descriptor?.policyBlocked && !policy.allowedCapabilities.includes(capabilityId)) return false
    return true
  }
}
