import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { TenantEngine } from './TenantEngine'
import type { RBACEngine } from './RBACEngine'
import type { ApprovalEngine, CreateApprovalRequestInput } from '../delegation/ApprovalEngine'
import type { ApprovalRequest } from '../delegation/ApprovalTypes'
import type { PolicyRecord, PolicyResult, PolicyEvaluation, PermissionAction } from './SecurityTypes'

const POLICIES_COL = (tenantId: string) => `tenants/${tenantId}/policies`

/**
 * Repository + evaluator for tenants/{tenantId}/policies.
 *
 * NO-BYPASS INVARIANT (same severity as Phase 5.0/5.1's no-approval-bypass
 * rule): when `evaluate()` returns `requireApproval`, the only legitimate
 * way to act on that result is `requestApprovalForPolicy()` below, which
 * calls the REAL `ApprovalEngine.createApprovalRequest` injected into this
 * class's constructor — never constructed internally, never a parallel
 * approval mechanism. This class never marks an action "approved" itself.
 */
export class PolicyEngine {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly tenants: TenantEngine,
    private readonly rbac: RBACEngine,
    private readonly approvalEngine: ApprovalEngine
  ) {}

  async createPolicy(
    tenantId: string,
    actorUserId: string,
    input: { name: string; description: string; action: PermissionAction; result: PolicyResult; requiredRole?: string | null }
  ): Promise<PolicyRecord> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const policyId = uuidv4()
    const now = new Date().toISOString()
    const record: PolicyRecord = {
      id: policyId,
      tenantId,
      policyId,
      name: input.name.trim(),
      description: input.description.trim(),
      action: input.action,
      result: input.result,
      requiredRole: input.requiredRole ?? null,
      enabled: true,
      createdBy: actorUserId,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(POLICIES_COL(tenantId)).doc(policyId).set(record)
    return record
  }

  async updatePolicy(
    tenantId: string,
    actorUserId: string,
    policyId: string,
    fields: Partial<Pick<PolicyRecord, 'name' | 'description' | 'result' | 'requiredRole' | 'enabled'>>
  ): Promise<PolicyRecord | null> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const ref = this.db.collection(POLICIES_COL(tenantId)).doc(policyId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ ...fields, updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as PolicyRecord
  }

  async getPolicy(tenantId: string, actorUserId: string, policyId: string): Promise<PolicyRecord | null> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const snap = await this.db.collection(POLICIES_COL(tenantId)).doc(policyId).get()
    return snap.exists ? (snap.data() as PolicyRecord) : null
  }

  async listPolicies(tenantId: string, actorUserId: string): Promise<PolicyRecord[]> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const snap = await this.db.collection(POLICIES_COL(tenantId)).get()
    return snap.docs.map((d) => d.data() as PolicyRecord)
  }

  async listPoliciesForAction(tenantId: string, actorUserId: string, action: PermissionAction): Promise<PolicyRecord[]> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const snap = await this.db.collection(POLICIES_COL(tenantId)).where('action', '==', action).where('enabled', '==', true).get()
    return snap.docs.map((d) => d.data() as PolicyRecord)
  }

  /**
   * Evaluate all enabled policies governing `action` for `userId`. Combines
   * with RBACEngine's permission check: a user must hold the underlying
   * permission AND not be denied/elevated/gated by any matching policy.
   * If multiple policies match, the most restrictive result wins, in order:
   * deny > requireApproval > requireElevatedRole > auditOnly > allow.
   */
  async evaluate(tenantId: string, userId: string, action: PermissionAction): Promise<PolicyEvaluation> {
    const hasPermission = await this.rbac.can(tenantId, userId, action)
    if (!hasPermission) {
      return { result: 'deny', policyId: null, reason: `User lacks underlying permission "${action}"` }
    }

    const policies = await this.listPoliciesForAction(tenantId, userId, action)
    if (policies.length === 0) {
      return { result: 'allow', policyId: null, reason: 'No governing policy; permission check passed' }
    }

    const priority: PolicyResult[] = ['deny', 'requireApproval', 'requireElevatedRole', 'auditOnly', 'allow']
    let winner = policies[0]
    for (const p of policies) {
      if (priority.indexOf(p.result) < priority.indexOf(winner.result)) winner = p
    }

    if (winner.result === 'requireElevatedRole' && winner.requiredRole) {
      try {
        await this.rbac.requireRole(tenantId, userId, winner.requiredRole)
        return { result: 'allow', policyId: winner.policyId, reason: `Elevated role "${winner.requiredRole}" satisfied` }
      } catch {
        return { result: 'requireElevatedRole', policyId: winner.policyId, reason: `Requires role "${winner.requiredRole}"` }
      }
    }

    return { result: winner.result, policyId: winner.policyId, reason: `Governed by policy "${winner.name}"` }
  }

  /**
   * The ONLY path by which a `requireApproval` policy result can be acted
   * on: routes to the real ApprovalEngine.createApprovalRequest. Never
   * executes the underlying action itself.
   */
  async requestApprovalForPolicy(
    actorUserId: string,
    input: Omit<CreateApprovalRequestInput, 'createdBy'>
  ): Promise<ApprovalRequest> {
    return this.approvalEngine.createApprovalRequest(actorUserId, { ...input, createdBy: actorUserId })
  }
}
