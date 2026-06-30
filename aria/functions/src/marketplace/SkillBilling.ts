import type { SkillManifest, PricingModel } from './MarketplaceTypes'

export interface BillingEligibility {
  eligible: boolean
  reason: string
  pricingModel: PricingModel
}

/**
 * Pricing-model gating for installation. This is a STRUCTURED PLACEHOLDER
 * like the security scanner — there is no real payment processor wired up
 * in this phase. `free` skills are always eligible; `one_time`,
 * `subscription`, and `usage_based` skills are recorded as NOT eligible
 * until a real billing integration exists, so SkillInstaller can block
 * paid installs honestly rather than silently treating them as free.
 */
export class SkillBilling {
  checkEligibility(manifest: SkillManifest): BillingEligibility {
    if (manifest.pricingModel === 'free') {
      return { eligible: true, reason: 'Free skill — no billing required', pricingModel: manifest.pricingModel }
    }
    return {
      eligible: false,
      reason: `Pricing model "${manifest.pricingModel}" requires a billing integration that is not implemented yet (placeholder)`,
      pricingModel: manifest.pricingModel,
    }
  }
}
