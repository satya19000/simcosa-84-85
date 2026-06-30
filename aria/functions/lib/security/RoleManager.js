"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleManager = void 0;
const uuid_1 = require("uuid");
const SecurityConfig_1 = require("./SecurityConfig");
const ROLES_COL = (tenantId) => `tenants/${tenantId}/roles`;
const ASSIGNMENTS_COL = (tenantId) => `tenants/${tenantId}/roleAssignments`;
/**
 * Repository for tenants/{tenantId}/roles and the role-assignment join
 * collection. Every method requires the actor to already hold a verified
 * tenant identity (checked via TenantEngine.requireIdentity) before reading
 * or writing — same no-cross-tenant-access invariant as TenantEngine/IdentityEngine.
 */
class RoleManager {
    constructor(db, tenants) {
        this.db = db;
        this.tenants = tenants;
    }
    /** Seed the default system roles for a brand-new tenant. Called only from tenant bootstrap. */
    async seedSystemRoles(tenantId, actorUserId) {
        const now = new Date().toISOString();
        const batch = this.db.batch();
        const records = [];
        for (const def of SecurityConfig_1.DEFAULT_SYSTEM_ROLES) {
            const roleId = (0, uuid_1.v4)();
            const record = {
                id: roleId,
                tenantId,
                roleId,
                name: def.name,
                scope: def.scope,
                permissions: def.permissions,
                inheritsFrom: null,
                isSystem: true,
                createdBy: actorUserId,
                createdAt: now,
                updatedAt: now,
            };
            batch.set(this.db.collection(ROLES_COL(tenantId)).doc(roleId), record);
            records.push(record);
        }
        await batch.commit();
        return records;
    }
    async createRole(tenantId, actorUserId, input) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const roleId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
            id: roleId,
            tenantId,
            roleId,
            name: input.name.trim(),
            scope: input.scope,
            permissions: input.permissions,
            inheritsFrom: input.inheritsFrom ?? null,
            isSystem: false,
            createdBy: actorUserId,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(ROLES_COL(tenantId)).doc(roleId).set(record);
        return record;
    }
    async getRole(tenantId, actorUserId, roleId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const snap = await this.db.collection(ROLES_COL(tenantId)).doc(roleId).get();
        return snap.exists ? snap.data() : null;
    }
    async getRoleByName(tenantId, roleName) {
        const snap = await this.db.collection(ROLES_COL(tenantId)).where('name', '==', roleName).limit(1).get();
        if (snap.empty)
            return null;
        return snap.docs[0].data();
    }
    async listRoles(tenantId, actorUserId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const snap = await this.db.collection(ROLES_COL(tenantId)).get();
        return snap.docs.map((d) => d.data());
    }
    async updateRole(tenantId, actorUserId, roleId, fields) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const ref = this.db.collection(ROLES_COL(tenantId)).doc(roleId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ ...fields, updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
    /** Resolve the full effective permission set for a role, following inheritsFrom chains (cycle-safe). */
    async resolveEffectivePermissions(tenantId, roleId, seen = new Set()) {
        if (seen.has(roleId))
            return [];
        seen.add(roleId);
        const snap = await this.db.collection(ROLES_COL(tenantId)).doc(roleId).get();
        if (!snap.exists)
            return [];
        const role = snap.data();
        const own = new Set(role.permissions);
        if (role.inheritsFrom) {
            const inherited = await this.resolveEffectivePermissions(tenantId, role.inheritsFrom, seen);
            for (const p of inherited)
                own.add(p);
        }
        return Array.from(own);
    }
    // ── Role assignments (temporary, delegated, scoped) ──────────────────────
    async assignRole(tenantId, actorUserId, input) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const assignmentId = (0, uuid_1.v4)();
        const record = {
            id: assignmentId,
            tenantId,
            assignmentId,
            identityId: input.identityId,
            roleId: input.roleId,
            scope: input.scope,
            scopeId: input.scopeId ?? null,
            expiresAt: input.expiresAt ?? null,
            delegatedBy: input.delegatedBy ?? null,
            createdBy: actorUserId,
            createdAt: new Date().toISOString(),
        };
        await this.db.collection(ASSIGNMENTS_COL(tenantId)).doc(assignmentId).set(record);
        return record;
    }
    async revokeAssignment(tenantId, actorUserId, assignmentId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const ref = this.db.collection(ASSIGNMENTS_COL(tenantId)).doc(assignmentId);
        const snap = await ref.get();
        if (!snap.exists)
            return false;
        await ref.delete();
        return true;
    }
    /** List non-expired role assignments for a given identity. Filters out expired temporary roles. */
    async listAssignmentsForIdentity(tenantId, actorUserId, identityId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const snap = await this.db.collection(ASSIGNMENTS_COL(tenantId)).where('identityId', '==', identityId).get();
        const now = Date.now();
        return snap.docs
            .map((d) => d.data())
            .filter((a) => !a.expiresAt || Date.parse(a.expiresAt) > now);
    }
}
exports.RoleManager = RoleManager;
//# sourceMappingURL=RoleManager.js.map