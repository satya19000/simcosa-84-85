import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { TenantEngine } from './TenantEngine'
import type { IdentityRecord, IdentityType } from './SecurityTypes'

const IDENTITIES_COL = (tenantId: string) => `tenants/${tenantId}/identities`

/**
 * Repository for tenants/{tenantId}/identities/{identityId}.
 *
 * HARD INVARIANT (same as TenantEngine): every method that reads or writes
 * an identity under a given tenantId first verifies the calling userId has
 * an active identity in that exact tenant via `this.tenants.requireIdentity`,
 * with the sole exception of `createFirstIdentity` (bootstrapping a brand
 * new tenant — there is nothing to check membership against yet, mirroring
 * OrganizationEngine.createOrganization's documented exception) and
 * `createIdentity`, which requires the actor to already hold an identity
 * with `security.manage` permission — enforced by the caller (RBACEngine/
 * SecurityEngine), never bypassed here.
 */
export class IdentityEngine {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly tenants: TenantEngine
  ) {}

  /** Bootstrap: create the very first identity in a brand-new tenant (the owner). No membership check possible yet. */
  async createFirstIdentity(
    tenantId: string,
    userId: string,
    input: { type: IdentityType; displayName: string; roles?: string[] }
  ): Promise<IdentityRecord> {
    return this.writeIdentity(tenantId, userId, input)
  }

  /** Create a new identity within a tenant. Caller (actorUserId) must already be a verified tenant identity. */
  async createIdentity(
    tenantId: string,
    actorUserId: string,
    input: { type: IdentityType; userId?: string | null; organizationId?: string | null; workspaceId?: string | null; displayName: string; roles?: string[] }
  ): Promise<IdentityRecord> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    return this.writeIdentity(tenantId, input.userId ?? null, input, actorUserId)
  }

  private async writeIdentity(
    tenantId: string,
    userId: string | null,
    input: { type: IdentityType; organizationId?: string | null; workspaceId?: string | null; displayName: string; roles?: string[] },
    createdBy?: string
  ): Promise<IdentityRecord> {
    const identityId = uuidv4()
    const now = new Date().toISOString()
    const record: IdentityRecord = {
      id: identityId,
      tenantId,
      identityId,
      userId,
      organizationId: input.organizationId ?? null,
      workspaceId: input.workspaceId ?? null,
      type: input.type,
      status: 'active',
      roles: input.roles ?? [],
      permissions: [],
      displayName: input.displayName.trim(),
      createdBy: createdBy ?? userId ?? 'system',
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(IDENTITIES_COL(tenantId)).doc(identityId).set(record)
    return record
  }

  async getIdentity(tenantId: string, actorUserId: string, identityId: string): Promise<IdentityRecord | null> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const snap = await this.db.collection(IDENTITIES_COL(tenantId)).doc(identityId).get()
    return snap.exists ? (snap.data() as IdentityRecord) : null
  }

  async listIdentities(tenantId: string, actorUserId: string): Promise<IdentityRecord[]> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const snap = await this.db.collection(IDENTITIES_COL(tenantId)).get()
    return snap.docs.map((d) => d.data() as IdentityRecord)
  }

  async updateIdentityStatus(
    tenantId: string,
    actorUserId: string,
    identityId: string,
    status: IdentityRecord['status']
  ): Promise<IdentityRecord | null> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const ref = this.db.collection(IDENTITIES_COL(tenantId)).doc(identityId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ status, updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as IdentityRecord
  }

  async assignRolesToIdentity(tenantId: string, actorUserId: string, identityId: string, roles: string[]): Promise<IdentityRecord | null> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const ref = this.db.collection(IDENTITIES_COL(tenantId)).doc(identityId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ roles, updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as IdentityRecord
  }
}
