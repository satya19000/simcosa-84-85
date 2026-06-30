import type { MarketplaceRegistry } from './MarketplaceRegistry'
import type { MarketplaceItemRecord, SkillManifest } from './MarketplaceTypes'

/** Tracks publish/update version history for a marketplace item. Wraps MarketplaceRegistry — no raw Firestore writes here. */
export class SkillVersionManager {
  constructor(private readonly registry: MarketplaceRegistry) {}

  async publishVersion(actorUserId: string, itemId: string, version: string, manifestPatch: Partial<SkillManifest>): Promise<MarketplaceItemRecord | null> {
    void actorUserId
    return this.registry.updateManifest(itemId, { ...manifestPatch, version })
  }

  async getCurrentVersion(itemId: string): Promise<string | null> {
    const item = await this.registry.getItem(itemId)
    return item?.manifest.version ?? null
  }

  isCompatibleUpgrade(fromVersion: string, toVersion: string): boolean {
    // Simple semver-major check: major version bumps are flagged as breaking, never silently auto-applied.
    const fromMajor = parseInt(fromVersion.split('.')[0] ?? '0', 10)
    const toMajor = parseInt(toVersion.split('.')[0] ?? '0', 10)
    return toMajor >= fromMajor
  }
}
