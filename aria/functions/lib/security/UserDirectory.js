"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDirectory = void 0;
const MemberManager_1 = require("../organization/MemberManager");
const InvitationManager_1 = require("../organization/InvitationManager");
const uuid_1 = require("uuid");
const SERVICE_ACCOUNTS_COL = (tenantId) => `tenants/${tenantId}/serviceAccounts`;
/**
 * Organization-level directory VIEW. This class does NOT duplicate
 * organization membership/invitation storage — it reads through to the
 * existing `organization/MemberManager` and `organization/InvitationManager`
 * (Phase 5.1) for member/invitation data, and only owns security-specific
 * data (service accounts) itself. Service accounts are a genuinely new
 * concept Phase 5.1 has no equivalent for, so they get their own collection
 * under the tenant.
 */
class UserDirectory {
    constructor(db, tenants, identities, groups, roles) {
        this.db = db;
        this.tenants = tenants;
        this.identities = identities;
        this.groups = groups;
        this.roles = roles;
        this.members = new MemberManager_1.MemberManager(db);
        this.invitations = new InvitationManager_1.InvitationManager(db);
    }
    async createServiceAccount(tenantId, actorUserId, input) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const identity = await this.identities.createIdentity(tenantId, actorUserId, {
            type: 'service_account',
            displayName: input.name,
        });
        const serviceAccountId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
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
        };
        await this.db.collection(SERVICE_ACCOUNTS_COL(tenantId)).doc(serviceAccountId).set(record);
        return record;
    }
    async listServiceAccounts(tenantId, actorUserId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const snap = await this.db.collection(SERVICE_ACCOUNTS_COL(tenantId)).get();
        return snap.docs.map((d) => d.data());
    }
    async revokeServiceAccount(tenantId, actorUserId, serviceAccountId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const ref = this.db.collection(SERVICE_ACCOUNTS_COL(tenantId)).doc(serviceAccountId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        const account = snap.data();
        await this.identities.updateIdentityStatus(tenantId, actorUserId, account.identityId, 'revoked');
        await ref.update({ revoked: true, updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
    /**
     * Composite directory view for an organization-linked tenant. Reads
     * member/invitation counts through Phase 5.1's MemberManager/
     * InvitationManager (no duplicated storage) and combines them with
     * tenant-owned group/role counts.
     */
    async getDirectoryView(tenantId, actorUserId, organizationId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const [groupList, roleList, serviceAccounts] = await Promise.all([
            this.groups.listGroups(tenantId, actorUserId),
            this.roles.listRoles(tenantId, actorUserId),
            this.listServiceAccounts(tenantId, actorUserId),
        ]);
        let memberCount = 0;
        let pendingInvitationCount = 0;
        if (organizationId) {
            const [memberList, invitationList] = await Promise.all([
                this.members.list(organizationId),
                this.invitations.list(organizationId),
            ]);
            memberCount = memberList.length;
            pendingInvitationCount = invitationList.filter((i) => i.status === 'pending').length;
        }
        return {
            tenantId,
            organizationId,
            memberCount,
            groupCount: groupList.length,
            serviceAccountCount: serviceAccounts.length,
            roleCount: roleList.length,
            pendingInvitationCount,
        };
    }
}
exports.UserDirectory = UserDirectory;
//# sourceMappingURL=UserDirectory.js.map