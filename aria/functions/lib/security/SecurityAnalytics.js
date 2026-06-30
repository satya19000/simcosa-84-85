"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAnalytics = void 0;
/** Read-only stats rollup, mirrors OrganizationAnalytics.ts / ApprovalAnalytics.ts. */
class SecurityAnalytics {
    constructor(tenants, identities, roles, policies, sessions, audit) {
        this.tenants = tenants;
        this.identities = identities;
        this.roles = roles;
        this.policies = policies;
        this.sessions = sessions;
        this.audit = audit;
    }
    async getSnapshot(tenantId, actorUserId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const [identityList, roleList, policyList, sessionList, auditList] = await Promise.all([
            this.identities.listIdentities(tenantId, actorUserId),
            this.roles.listRoles(tenantId, actorUserId),
            this.policies.listPolicies(tenantId, actorUserId),
            this.sessions.listSessions(tenantId, actorUserId),
            this.audit.listEvents(tenantId, actorUserId),
        ]);
        return {
            tenantId,
            identityCount: identityList.length,
            activeSessionCount: sessionList.filter((s) => s.active).length,
            roleCount: roleList.length,
            policyCount: policyList.length,
            recentAuditEventCount: auditList.length,
            highRiskAuditEventCount: auditList.filter((e) => e.riskLevel === 'high' || e.riskLevel === 'critical').length,
            computedAt: new Date().toISOString(),
        };
    }
}
exports.SecurityAnalytics = SecurityAnalytics;
//# sourceMappingURL=SecurityAnalytics.js.map