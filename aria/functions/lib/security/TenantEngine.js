"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantEngine = void 0;
const uuid_1 = require("uuid");
const TENANTS_COL = 'tenants';
const IDENTITIES_COL = (tenantId) => `tenants/${tenantId}/identities`;
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
class TenantEngine {
    constructor(db) {
        this.db = db;
    }
    // ── Tenant lifecycle ────────────────────────────────────────────────────
    async createTenant(userId, input) {
        const tenantId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
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
        };
        await this.db.collection(TENANTS_COL).doc(tenantId).set(record);
        return record;
    }
    /** Read a tenant record. Caller must already be verified as a tenant identity (see requireIdentity). */
    async getTenant(tenantId) {
        const snap = await this.db.collection(TENANTS_COL).doc(tenantId).get();
        return snap.exists ? snap.data() : null;
    }
    async updateTenant(tenantId, fields) {
        const ref = this.db.collection(TENANTS_COL).doc(tenantId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ ...fields, updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
    async listTenantsForOwner(ownerId) {
        const snap = await this.db.collection(TENANTS_COL).where('ownerId', '==', ownerId).get();
        return snap.docs.map((d) => d.data());
    }
    // ── Tenant-membership check — the no-cross-tenant-access gate ───────────
    /** Look up the calling user's identity within a tenant. Returns null if none/inactive. */
    async getIdentityForUser(tenantId, userId) {
        const snap = await this.db
            .collection(IDENTITIES_COL(tenantId))
            .where('userId', '==', userId)
            .limit(1)
            .get();
        if (snap.empty)
            return null;
        const record = snap.docs[0].data();
        if (record.status !== 'active')
            return null;
        return record;
    }
    async hasIdentityInTenant(tenantId, userId) {
        const identity = await this.getIdentityForUser(tenantId, userId);
        return identity !== null;
    }
    /** Throws if userId has no active identity within tenantId. Returns the identity record. */
    async requireIdentity(tenantId, userId) {
        const identity = await this.getIdentityForUser(tenantId, userId);
        if (!identity) {
            throw new Error(`Access denied: user ${userId} has no identity in tenant ${tenantId}`);
        }
        return identity;
    }
}
exports.TenantEngine = TenantEngine;
//# sourceMappingURL=TenantEngine.js.map