import type { TenantEngine } from './TenantEngine'
import type { IdentityEngine } from './IdentityEngine'
import type { RoleManager } from './RoleManager'
import type { PolicyEngine } from './PolicyEngine'
import type { SessionManager } from './SessionManager'
import type { SecurityAudit } from './SecurityAudit'

export interface SecurityAnalyticsSnapshot {
  tenantId: string
  identityCount: number
  activeSessionCount: number
  roleCount: number
  policyCount: number
  recentAuditEventCount: number
  highRiskAuditEventCount: number
  computedAt: string
}

/** Read-only stats rollup, mirrors OrganizationAnalytics.ts / ApprovalAnalytics.ts. */
export class SecurityAnalytics {
  constructor(
    private readonly tenants: TenantEngine,
    private readonly identities: IdentityEngine,
    private readonly roles: RoleManager,
    private readonly policies: PolicyEngine,
    private readonly sessions: SessionManager,
    private readonly audit: SecurityAudit
  ) {}

  async getSnapshot(tenantId: string, actorUserId: string): Promise<SecurityAnalyticsSnapshot> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const [identityList, roleList, policyList, sessionList, auditList] = await Promise.all([
      this.identities.listIdentities(tenantId, actorUserId),
      this.roles.listRoles(tenantId, actorUserId),
      this.policies.listPolicies(tenantId, actorUserId),
      this.sessions.listSessions(tenantId, actorUserId),
      this.audit.listEvents(tenantId, actorUserId),
    ])
    return {
      tenantId,
      identityCount: identityList.length,
      activeSessionCount: sessionList.filter((s) => s.active).length,
      roleCount: roleList.length,
      policyCount: policyList.length,
      recentAuditEventCount: auditList.length,
      highRiskAuditEventCount: auditList.filter((e) => e.riskLevel === 'high' || e.riskLevel === 'critical').length,
      computedAt: new Date().toISOString(),
    }
  }
}
