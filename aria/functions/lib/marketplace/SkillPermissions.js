"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillPermissions = void 0;
const uuid_1 = require("uuid");
const MarketplaceTypes_1 = require("./MarketplaceTypes");
const SKILL_PERMISSIONS_COL = (tenantId) => `tenants/${tenantId}/skillPermissions`;
/**
 * Evaluates and records skill permission grants. Permission EVALUATION
 * (does this actor have rights to install something requesting these
 * scopes) is delegated entirely to the real security/RBACEngine via
 * `requirePermission`/`can` — this class never reimplements RBAC logic.
 * It only maps skill permission scopes to the underlying tenant
 * `security.manage`/`plugins.install` actions and persists the resulting
 * grant records.
 */
class SkillPermissions {
    constructor(db, rbac) {
        this.db = db;
        this.rbac = rbac;
    }
    /** True if any requested scope is high-risk (requires approval before grant). */
    static hasHighRiskScope(scopes) {
        return scopes.some((s) => MarketplaceTypes_1.HIGH_RISK_PERMISSION_SCOPES.includes(s));
    }
    /** Verifies the installing actor holds the underlying tenant permission to install plugins at all. */
    async requireCanInstall(tenantId, actorUserId) {
        await this.rbac.requirePermission(tenantId, actorUserId, 'plugins.install');
    }
    async recordGrants(tenantId, actorUserId, installationId, itemId, scopes) {
        const now = new Date().toISOString();
        const records = [];
        for (const scope of scopes) {
            const permissionId = (0, uuid_1.v4)();
            const record = {
                id: permissionId,
                permissionId,
                tenantId,
                installationId,
                itemId,
                scope,
                granted: true,
                grantedBy: actorUserId,
                createdBy: actorUserId,
                createdAt: now,
                updatedAt: now,
            };
            await this.db.collection(SKILL_PERMISSIONS_COL(tenantId)).doc(permissionId).set(record);
            records.push(record);
        }
        return records;
    }
    async revokeGrant(tenantId, permissionId) {
        const ref = this.db.collection(SKILL_PERMISSIONS_COL(tenantId)).doc(permissionId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ granted: false, updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
    async listGrants(tenantId, installationId) {
        const snap = await this.db.collection(SKILL_PERMISSIONS_COL(tenantId)).where('installationId', '==', installationId).get();
        return snap.docs.map((d) => d.data());
    }
}
exports.SkillPermissions = SkillPermissions;
//# sourceMappingURL=SkillPermissions.js.map