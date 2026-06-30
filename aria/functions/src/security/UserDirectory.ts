import type * as admin from 'firebase-admin'
import type { TenantEngine } from './TenantEngine'
import type { IdentityEngine } from './IdentityEngine'
import type { GroupManager } from './GroupManager'
import type { RoleManager } from './RoleManager'
import { MemberManager } from '../organization/MemberManager'
import { InvitationManager } from '../organization/InvitationManager'
import type { ServiceAccountRecord, DirectoryView, IdentityRecord } from './SecurityTypes'
import { v4 as uuidv4 } from 'uuid'

const SERVICE_ACCOUNTS_COL = (tenantId: string) => `tenants/${tenantId}/serviceAccounts`

/**
 * Organization-level directory VIEW. This class does NOT duplicate
 * organization membership/invitation storage — it reads through to the
 * existing `organization/MemberManager` and `organization/InvitationManager`
 * (Phase 5.1) for member/invitation data, and only owns security-specific
 * data (service accounts) itself. Service accounts are a genuinely new
 * concept Phase 5.1 has no equivalent for, so they get their own collection
 * under the tenant.
 */
export class UserDirectory {
  private readonly members: MemberManager
  private readonly invitations: InvitationManager

  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly tenants: TenantEngine,
    private readonly identities: IdentityEngine,
    private readonly groups: GroupManager,
    private readonly roles: RoleManager
  ) {
    this.members = new MemberManager(db)
    this.invitations = new InvitationManager(db)
  }

  async createServiceAccount(
    tenantId: string,
    actorUserId: string,
    input: { name: string; description?: string }
  ): Promise<ServiceAccountRecord> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const identity: IdentityRecord = await this.identities.createIdentity(tenantId, actorUserId, {
      type: 'service_account',
      displayName: input.name,
    })
    const serviceAccountId = uuidv4()
    const now = new Date().toISOString()
    const record: ServiceAccountRecord = {
      id: serviceAccountId,
      tenantId,
      serviceAccountId,
      identityId: identity.identityId,
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      createdBy: actorUserId,
      createdAt: now,
      updatedAt: now,
      revoked: false,
    }
    await this.db.collection(SERVICE_ACCOUNTS_COL(tenantId)).doc(serviceAccountId).set(record)
    return record
  }

  async listServiceAccounts(tenantId: string, actorUserId: string): Promise<ServiceAccountRecord[]> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const snap = await this.db.collection(SERVICE_ACCOUNTS_COL(tenantId)).get()
    return snap.docs.map((d) => d.data() as ServiceAccountRecord)
  }

  async revokeServiceAccount(tenantId: string, actorUserId: string, serviceAccountId: string): Promise<ServiceAccountRecord | null> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const ref = this.db.collection(SERVICE_ACCOUNTS_COL(tenantId)).doc(serviceAccountId)
    const snap = await ref.get()
    if (!snap.exists) return null
    const account = snap.data() as ServiceAccountRecord
    await this.identities.updateIdentityStatus(tenantId, actorUserId, account.identityId, 'revoked')
    await ref.update({ revoked: true, updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as ServiceAccountRecord
  }

  /**
   * Composite directory view for an organization-linked tenant. Reads
   * member/invitation counts through Phase 5.1's MemberManager/
   * InvitationManager (no duplicated storage) and combines them with
   * tenant-owned group/role counts.
   */
  async getDirectoryView(tenantId: string, actorUserId: string, organizationId: string | null): Promise<DirectoryView> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const [groupList, roleList, serviceAccounts] = await Promise.all([
      this.groups.listGroups(tenantId, actorUserId),
      this.roles.listRoles(tenantId, actorUserId),
      this.listServiceAccounts(tenantId, actorUserId),
    ])

    let memberCount = 0
    let pendingInvitationCount = 0
    if (organizationId) {
      const [memberList, invitationList] = await Promise.all([
        this.members.list(organizationId),
        this.invitations.list(organizationId),
      ])
      memberCount = memberList.length
      pendingInvitationCount = invitationList.filter((i) => i.status === 'pending').length
    }

    return {
      tenantId,
      organizationId,
      memberCount,
      groupCount: groupList.length,
      serviceAccountCount: serviceAccounts.length,
      roleCount: roleList.length,
      pendingInvitationCount,
    }
  }
}
