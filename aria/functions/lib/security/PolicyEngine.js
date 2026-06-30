"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyEngine = void 0;
const uuid_1 = require("uuid");
const POLICIES_COL = (tenantId) => `tenants/${tenantId}/policies`;
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
class PolicyEngine {
    constructor(db, tenants, rbac, approvalEngine) {
        this.db = db;
        this.tenants = tenants;
        this.rbac = rbac;
        this.approvalEngine = approvalEngine;
    }
    async createPolicy(tenantId, actorUserId, input) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const policyId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
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
        };
        await this.db.collection(POLICIES_COL(tenantId)).doc(policyId).set(record);
        return record;
    }
    async updatePolicy(tenantId, actorUserId, policyId, fields) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const ref = this.db.collection(POLICIES_COL(tenantId)).doc(policyId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ ...fields, updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
    async getPolicy(tenantId, actorUserId, policyId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const snap = await this.db.collection(POLICIES_COL(tenantId)).doc(policyId).get();
        return snap.exists ? snap.data() : null;
    }
    async listPolicies(tenantId, actorUserId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const snap = await this.db.collection(POLICIES_COL(tenantId)).get();
        return snap.docs.map((d) => d.data());
    }
    async listPoliciesForAction(tenantId, actorUserId, action) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const snap = await this.db.collection(POLICIES_COL(tenantId)).where('action', '==', action).where('enabled', '==', true).get();
        return snap.docs.map((d) => d.data());
    }
    /**
     * Evaluate all enabled policies governing `action` for `userId`. Combines
     * with RBACEngine's permission check: a user must hold the underlying
     * permission AND not be denied/elevated/gated by any matching policy.
     * If multiple policies match, the most restrictive result wins, in order:
     * deny > requireApproval > requireElevatedRole > auditOnly > allow.
     */
    async evaluate(tenantId, userId, action) {
        const hasPermission = await this.rbac.can(tenantId, userId, action);
        if (!hasPermission) {
            return { result: 'deny', policyId: null, reason: `User lacks underlying permission "${action}"` };
        }
        const policies = await this.listPoliciesForAction(tenantId, userId, action);
        if (policies.length === 0) {
            return { result: 'allow', policyId: null, reason: 'No governing policy; permission check passed' };
        }
        const priority = ['deny', 'requireApproval', 'requireElevatedRole', 'auditOnly', 'allow'];
        let winner = policies[0];
        for (const p of policies) {
            if (priority.indexOf(p.result) < priority.indexOf(winner.result))
                winner = p;
        }
        if (winner.result === 'requireElevatedRole' && winner.requiredRole) {
            try {
                await this.rbac.requireRole(tenantId, userId, winner.requiredRole);
                return { result: 'allow', policyId: winner.policyId, reason: `Elevated role "${winner.requiredRole}" satisfied` };
            }
            catch {
                return { result: 'requireElevatedRole', policyId: winner.policyId, reason: `Requires role "${winner.requiredRole}"` };
            }
        }
        return { result: winner.result, policyId: winner.policyId, reason: `Governed by policy "${winner.name}"` };
    }
    /**
     * The ONLY path by which a `requireApproval` policy result can be acted
     * on: routes to the real ApprovalEngine.createApprovalRequest. Never
     * executes the underlying action itself.
     */
    async requestApprovalForPolicy(actorUserId, input) {
        return this.approvalEngine.createApprovalRequest(actorUserId, { ...input, createdBy: actorUserId });
    }
}
exports.PolicyEngine = PolicyEngine;
//# sourceMappingURL=PolicyEngine.js.map