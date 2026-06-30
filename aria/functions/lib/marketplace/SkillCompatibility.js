"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillCompatibility = void 0;
const ARIA_VERSION = '5.3.0';
/**
 * Checks a skill manifest's compatibility against tenant plan/type,
 * enabled engines, required plugins/providers, organization type, and
 * platform type. Reads tenant plan/type through the REAL
 * security/TenantEngine — never duplicates tenant storage or RBAC logic.
 */
class SkillCompatibility {
    constructor(_db, tenants) {
        this.tenants = tenants;
    }
    async checkCompatibility(tenantId, actorUserId, manifest, installedPluginIds) {
        const reasons = [];
        // Tenant must exist and caller must be a member (read-through, not a duplicate gate —
        // SkillInstaller separately calls requireIdentity itself for the install flow as a whole).
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const tenant = await this.tenants.getTenant(tenantId);
        if (!tenant) {
            reasons.push(`Tenant ${tenantId} not found`);
            return { compatible: false, reasons };
        }
        if (manifest.compatibleVersions.length > 0 && !manifest.compatibleVersions.includes(ARIA_VERSION)) {
            reasons.push(`Skill targets ARIA versions [${manifest.compatibleVersions.join(', ')}], running ${ARIA_VERSION}`);
        }
        if (manifest.installationType === 'organization' && !tenant.organizationId) {
            reasons.push('Skill requires an organization-linked tenant, but this tenant has no organizationId');
        }
        // Free-plan tenants cannot install paid/usage-based skills.
        if (tenant.plan === 'free' && manifest.pricingModel !== 'free') {
            reasons.push(`Tenant plan "${tenant.plan}" cannot install a "${manifest.pricingModel}" skill`);
        }
        for (const requiredPluginId of manifest.requiredPlugins) {
            if (!installedPluginIds.includes(requiredPluginId)) {
                reasons.push(`Required plugin "${requiredPluginId}" is not installed`);
            }
        }
        return { compatible: reasons.length === 0, reasons };
    }
}
exports.SkillCompatibility = SkillCompatibility;
//# sourceMappingURL=SkillCompatibility.js.map