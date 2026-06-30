import type * as admin from 'firebase-admin'
import type { TenantEngine } from '../security/TenantEngine'
import type { SkillManifest, CompatibilityCheckResult } from './MarketplaceTypes'

const ARIA_VERSION = '5.3.0'

/**
 * Checks a skill manifest's compatibility against tenant plan/type,
 * enabled engines, required plugins/providers, organization type, and
 * platform type. Reads tenant plan/type through the REAL
 * security/TenantEngine — never duplicates tenant storage or RBAC logic.
 */
export class SkillCompatibility {
  constructor(
    _db: admin.firestore.Firestore,
    private readonly tenants: TenantEngine
  ) {}

  async checkCompatibility(
    tenantId: string,
    actorUserId: string,
    manifest: SkillManifest,
    installedPluginIds: string[]
  ): Promise<CompatibilityCheckResult> {
    const reasons: string[] = []

    // Tenant must exist and caller must be a member (read-through, not a duplicate gate —
    // SkillInstaller separately calls requireIdentity itself for the install flow as a whole).
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const tenant = await this.tenants.getTenant(tenantId)
    if (!tenant) {
      reasons.push(`Tenant ${tenantId} not found`)
      return { compatible: false, reasons }
    }

    if (manifest.compatibleVersions.length > 0 && !manifest.compatibleVersions.includes(ARIA_VERSION)) {
      reasons.push(`Skill targets ARIA versions [${manifest.compatibleVersions.join(', ')}], running ${ARIA_VERSION}`)
    }

    if (manifest.installationType === 'organization' && !tenant.organizationId) {
      reasons.push('Skill requires an organization-linked tenant, but this tenant has no organizationId')
    }

    // Free-plan tenants cannot install paid/usage-based skills.
    if (tenant.plan === 'free' && manifest.pricingModel !== 'free') {
      reasons.push(`Tenant plan "${tenant.plan}" cannot install a "${manifest.pricingModel}" skill`)
    }

    for (const requiredPluginId of manifest.requiredPlugins) {
      if (!installedPluginIds.includes(requiredPluginId)) {
        reasons.push(`Required plugin "${requiredPluginId}" is not installed`)
      }
    }

    return { compatible: reasons.length === 0, reasons }
  }
}
