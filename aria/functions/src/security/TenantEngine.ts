import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { TenantRecord, TenantType, IdentityRecord } from './SecurityTypes'

const TENANTS_COL = 'tenants'
const IDENTITIES_COL = (tenantId: string) => `tenants/${tenantId}/identities`

/**
 * Repository for tenants/{tenantId} plus the tenant-membership check that
 * every other security Manager/Engine method must call first.
 *
 * HARD INVARIANT (top security invariant for Phase 5.2, equivalent in
 * importance to "no approval bypass" / "no cross-organization access"):
 * every method anywhere in security/ that reads or writes anything under
 * tenants/{tenantId}/** MUST first verify the calling userId has an active
 * identity within that exact tenantId via hasIdentityInTenant/requireIdentity
 * below. No method may skip this check. There is no cross-tenant access path.
 */
export class TenantEngine {
  constructor(private readonly db: admin.firestore.Firestore) {}

  // ── Tenant lifecycle ────────────────────────────────────────────────────

  async createTenant(
    userId: string,
    input: { name: string; tenantType: TenantType; organizationId?: string | null; plan?: TenantRecord['plan'] }
  ): Promise<TenantRecord> {
    const tenantId = uuidv4()
    const now = new Date().toISOString()
    const record: TenantRecord = {
      id: tenantId,
      tenantId,
      tenantType: input.tenantType,
      organizationId: input.organizationId ?? null,
      ownerId: userId,
      status: 'active',
      plan: input.plan ?? 'free',
      name: input.name.trim(),
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(TENANTS_COL).doc(tenantId).set(record)
    return record
  }

  /** Read a tenant record. Caller must already be verified as a tenant identity (see requireIdentity). */
  async getTenant(tenantId: string): Promise<TenantRecord | null> {
    const snap = await this.db.collection(TENANTS_COL).doc(tenantId).get()
    return snap.exists ? (snap.data() as TenantRecord) : null
  }

  async updateTenant(tenantId: string, fields: Partial<Pick<TenantRecord, 'name' | 'status' | 'plan'>>): Promise<TenantRecord | null> {
    const ref = this.db.collection(TENANTS_COL).doc(tenantId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ ...fields, updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as TenantRecord
  }

  async listTenantsForOwner(ownerId: string): Promise<TenantRecord[]> {
    const snap = await this.db.collection(TENANTS_COL).where('ownerId', '==', ownerId).get()
    return snap.docs.map((d) => d.data() as TenantRecord)
  }

  // ── Tenant-membership check — the no-cross-tenant-access gate ───────────

  /** Look up the calling user's identity within a tenant. Returns null if none/inactive. */
  async getIdentityForUser(tenantId: string, userId: string): Promise<IdentityRecord | null> {
    const snap = await this.db
      .collection(IDENTITIES_COL(tenantId))
      .where('userId', '==', userId)
      .limit(1)
      .get()
    if (snap.empty) return null
    const record = snap.docs[0].data() as IdentityRecord
    if (record.status !== 'active') return null
    return record
  }

  async hasIdentityInTenant(tenantId: string, userId: string): Promise<boolean> {
    const identity = await this.getIdentityForUser(tenantId, userId)
    return identity !== null
  }

  /** Throws if userId has no active identity within tenantId. Returns the identity record. */
  async requireIdentity(tenantId: string, userId: string): Promise<IdentityRecord> {
    const identity = await this.getIdentityForUser(tenantId, userId)
    if (!identity) {
      throw new Error(`Access denied: user ${userId} has no identity in tenant ${tenantId}`)
    }
    return identity
  }
}
