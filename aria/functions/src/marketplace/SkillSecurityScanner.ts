import type { SkillManifest, SecurityScanResult, SkillPermissionScope } from './MarketplaceTypes'
import { HIGH_RISK_PERMISSION_SCOPES } from './MarketplaceTypes'

const HEALTH_FINANCE_SCOPES: SkillPermissionScope[] = ['read.health', 'write.health', 'read.finance', 'write.finance']
const EXTERNAL_API_SCOPES: SkillPermissionScope[] = ['send.email', 'send.sms', 'send.whatsapp', 'execute.actions', 'install.plugins']
const DATA_ACCESS_SCOPES: SkillPermissionScope[] = [
  'read.tasks', 'write.tasks', 'read.contacts', 'write.contacts',
  'read.documents', 'write.documents', 'read.location', 'write.location', 'access.memory',
]
const ORG_IMPACT_SCOPES: SkillPermissionScope[] = ['access.organization', 'run.workflows', 'install.plugins']

/**
 * STRUCTURED PLACEHOLDER SECURITY SCANNER.
 *
 * This class does NOT perform real malware scanning, static code analysis,
 * binary inspection, or sandboxed execution of any skill artifact. ARIA has
 * no skill "code" to execute at install time in this phase — manifests are
 * declarative metadata only (capabilities/permissions/required engines),
 * so there is nothing to run a scanner over yet.
 *
 * What this DOES do: compute a deterministic, explainable 0-100 risk score
 * purely from the DECLARED manifest fields (permission scopes requested,
 * dependency count, whether health/finance/external-API/org-wide scopes are
 * requested). This score feeds SkillInstaller's approval-required decision
 * (step 6) and SkillAnalytics — it is a structured architecture for a real
 * scanner to be plugged into later (e.g. static analysis of an uploaded
 * bundle, virus-scanning an attachment, sandboxed execution telemetry), but
 * today it is honest, declared-metadata-only scoring. Document this
 * plainly anywhere this class's output is surfaced to a user or admin.
 */
export class SkillSecurityScanner {
  scan(manifest: SkillManifest, missingDependencyCount: number): SecurityScanResult {
    const reasons: string[] = []

    const permissionRiskScore = this.scorePermissionRisk(manifest.permissions, reasons)
    const dependencyRiskScore = this.scoreDependencyRisk(manifest, missingDependencyCount, reasons)
    const externalApiRiskScore = this.scoreSubset(manifest.permissions, EXTERNAL_API_SCOPES, 'external API / communication', reasons)
    const dataAccessRiskScore = this.scoreSubset(manifest.permissions, DATA_ACCESS_SCOPES, 'personal data access', reasons)
    const healthFinanceRiskScore = this.scoreSubset(manifest.permissions, HEALTH_FINANCE_SCOPES, 'health/finance data access', reasons)
    const organizationImpactRiskScore = this.scoreSubset(manifest.permissions, ORG_IMPACT_SCOPES, 'organization-wide impact', reasons)

    const score = Math.round(
      Math.min(
        100,
        permissionRiskScore * 0.3 +
          dependencyRiskScore * 0.1 +
          externalApiRiskScore * 0.2 +
          dataAccessRiskScore * 0.15 +
          healthFinanceRiskScore * 0.15 +
          organizationImpactRiskScore * 0.1
      )
    )

    const riskLevel: SecurityScanResult['riskLevel'] = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low'

    return {
      score,
      riskLevel,
      permissionRiskScore,
      dependencyRiskScore,
      externalApiRiskScore,
      dataAccessRiskScore,
      healthFinanceRiskScore,
      organizationImpactRiskScore,
      reasons,
      scannedAt: new Date().toISOString(),
      isPlaceholder: true,
    }
  }

  private scorePermissionRisk(permissions: SkillPermissionScope[], reasons: string[]): number {
    const highRiskCount = permissions.filter((p) => HIGH_RISK_PERMISSION_SCOPES.includes(p)).length
    if (highRiskCount > 0) reasons.push(`Requests ${highRiskCount} high-risk permission scope(s)`)
    return Math.min(100, permissions.length * 5 + highRiskCount * 15)
  }

  private scoreDependencyRisk(manifest: SkillManifest, missingDependencyCount: number, reasons: string[]): number {
    const declaredCount = manifest.requiredPlugins.length + manifest.requiredEngines.length
    if (missingDependencyCount > 0) reasons.push(`${missingDependencyCount} declared dependency(ies) not currently resolvable`)
    return Math.min(100, declaredCount * 8 + missingDependencyCount * 20)
  }

  private scoreSubset(permissions: SkillPermissionScope[], subset: SkillPermissionScope[], label: string, reasons: string[]): number {
    const matched = permissions.filter((p) => subset.includes(p))
    if (matched.length > 0) reasons.push(`Requests ${label}: ${matched.join(', ')}`)
    return Math.min(100, matched.length * 25)
  }
}
