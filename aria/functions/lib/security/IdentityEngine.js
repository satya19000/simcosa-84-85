"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityEngine = void 0;
const uuid_1 = require("uuid");
const IDENTITIES_COL = (tenantId) => `tenants/${tenantId}/identities`;
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
class IdentityEngine {
    constructor(db, tenants) {
        this.db = db;
        this.tenants = tenants;
    }
    /** Bootstrap: create the very first identity in a brand-new tenant (the owner). No membership check possible yet. */
    async createFirstIdentity(tenantId, userId, input) {
        return this.writeIdentity(tenantId, userId, input);
    }
    /** Create a new identity within a tenant. Caller (actorUserId) must already be a verified tenant identity. */
    async createIdentity(tenantId, actorUserId, input) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        return this.writeIdentity(tenantId, input.userId ?? null, input, actorUserId);
    }
    async writeIdentity(tenantId, userId, input, createdBy) {
        const identityId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
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
        };
        await this.db.collection(IDENTITIES_COL(tenantId)).doc(identityId).set(record);
        return record;
    }
    async getIdentity(tenantId, actorUserId, identityId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const snap = await this.db.collection(IDENTITIES_COL(tenantId)).doc(identityId).get();
        return snap.exists ? snap.data() : null;
    }
    async listIdentities(tenantId, actorUserId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const snap = await this.db.collection(IDENTITIES_COL(tenantId)).get();
        return snap.docs.map((d) => d.data());
    }
    async updateIdentityStatus(tenantId, actorUserId, identityId, status) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const ref = this.db.collection(IDENTITIES_COL(tenantId)).doc(identityId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ status, updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
    async assignRolesToIdentity(tenantId, actorUserId, identityId, roles) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const ref = this.db.collection(IDENTITIES_COL(tenantId)).doc(identityId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ roles, updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
}
exports.IdentityEngine = IdentityEngine;
//# sourceMappingURL=IdentityEngine.js.map