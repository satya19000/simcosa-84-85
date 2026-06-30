import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { TenantEngine } from '../security/TenantEngine'
import { ModelPermissions } from './ModelPermissions'
import { ModelUsageTracker } from './ModelUsageTracker'
import type { AIPolicyRecord, AIProviderId, ModelTaskType, PrivacyLevel } from './ModelTypes'

const POLICIES_COL = (tenantId: string) => `tenants/${tenantId}/aiPolicies`
const DEFAULT_POLICY_DOC_ID = 'default'

export interface PolicyCheckResult {
  allowed: boolean
  reason: string
}

/**
 * Tenant-scoped AI policy repository + evaluator. Reuses the existing
 * Security/Policy Engine's invariants (TenantEngine.requireIdentity first,
 * RBAC-gated mutation) rather than re-deriving them — this class does NOT
 * duplicate PolicyEngine's generic allow/deny/requireApproval machinery; it
 * is a narrower, AI-specific policy surface (provider allow/block lists,
 * spend caps, task-type restrictions, privacy mode) that composes
 * TenantEngine + ModelPermissions directly.
 */
export class ModelPolicyEngine {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly tenants: TenantEngine,
    private readonly permissions: ModelPermissions,
    private readonly usage: ModelUsageTracker
  ) {}

  async getPolicy(tenantId: string, actorUserId: string): Promise<AIPolicyRecord> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const snap = await this.db.collection(POLICIES_COL(tenantId)).doc(DEFAULT_POLICY_DOC_ID).get()
    if (snap.exists) return snap.data() as AIPolicyRecord
    return this.defaultPolicy(tenantId, actorUserId)
  }

  async updatePolicy(
    tenantId: string,
    actorUserId: string,
    fields: Partial<Pick<AIPolicyRecord,
      'allowedProviders' | 'blockedProviders' | 'maxMonthlySpendUsd' | 'allowedTaskTypes' | 'privacyRestriction' | 'localOnlyMode'
    >>
  ): Promise<AIPolicyRecord> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    await this.permissions.requireManagePolicy(tenantId, actorUserId)

    const existing = await this.getPolicy(tenantId, actorUserId)
    const updated: AIPolicyRecord = {
      ...existing,
      ...fields,
      updatedAt: new Date().toISOString(),
    }
    await this.db.collection(POLICIES_COL(tenantId)).doc(DEFAULT_POLICY_DOC_ID).set(updated, { merge: true })
    return updated
  }

  /**
   * Evaluate whether a routing candidate is permitted under tenant policy.
   * Checks provider allow/block lists, task-type restrictions, privacy
   * restriction, and month-to-date spend ceiling (via ModelUsageTracker —
   * never re-sums usage itself).
   */
  async evaluate(
    tenantId: string,
    actorUserId: string,
    candidate: { provider: AIProviderId; taskType: ModelTaskType; privacyLevel: PrivacyLevel; estimatedCostUsd: number }
  ): Promise<PolicyCheckResult> {
    const policy = await this.getPolicy(tenantId, actorUserId)

    if (policy.blockedProviders.includes(candidate.provider)) {
      return { allowed: false, reason: `Provider "${candidate.provider}" is blocked by tenant policy` }
    }
    if (policy.allowedProviders.length > 0 && !policy.allowedProviders.includes(candidate.provider)) {
      return { allowed: false, reason: `Provider "${candidate.provider}" is not in the tenant's allowed-providers list` }
    }
    if (policy.allowedTaskTypes && !policy.allowedTaskTypes.includes(candidate.taskType)) {
      return { allowed: false, reason: `Task type "${candidate.taskType}" is not permitted by tenant policy` }
    }
    if (policy.privacyRestriction && candidate.privacyLevel !== policy.privacyRestriction && candidate.provider !== 'local') {
      return { allowed: false, reason: `Tenant requires privacy level "${policy.privacyRestriction}"; candidate is "${candidate.privacyLevel}"` }
    }
    if (policy.localOnlyMode && candidate.provider !== 'local') {
      // localOnlyMode is a PLACEHOLDER restriction — LocalLLMProvider is not
      // functional yet, so enabling this effectively blocks all routing.
      // That is intentional: it must fail closed, never silently fall back
      // to a cloud provider when the tenant explicitly asked for local-only.
      return { allowed: false, reason: 'Tenant policy requires local-only mode, and LocalLLMProvider is a placeholder (not functional)' }
    }
    if (policy.maxMonthlySpendUsd != null) {
      const monthToDate = await this.usage.getMonthToDateSpend(tenantId)
      if (monthToDate + candidate.estimatedCostUsd > policy.maxMonthlySpendUsd) {
        return { allowed: false, reason: `Estimated request would exceed tenant's max monthly AI spend ($${policy.maxMonthlySpendUsd})` }
      }
    }
    return { allowed: true, reason: 'Allowed' }
  }

  private defaultPolicy(tenantId: string, actorUserId: string): AIPolicyRecord {
    const now = new Date().toISOString()
    return {
      id: DEFAULT_POLICY_DOC_ID,
      policyId: DEFAULT_POLICY_DOC_ID,
      tenantId,
      allowedProviders: [],
      blockedProviders: [],
      maxMonthlySpendUsd: null,
      allowedTaskTypes: null,
      privacyRestriction: null,
      localOnlyMode: false,
      createdBy: actorUserId,
      createdAt: now,
      updatedAt: now,
    }
  }
}

export function newPolicyId(): string {
  return uuidv4()
}
