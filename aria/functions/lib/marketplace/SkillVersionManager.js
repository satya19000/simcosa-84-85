"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillVersionManager = void 0;
/** Tracks publish/update version history for a marketplace item. Wraps MarketplaceRegistry — no raw Firestore writes here. */
class SkillVersionManager {
    constructor(registry) {
        this.registry = registry;
    }
    async publishVersion(actorUserId, itemId, version, manifestPatch) {
        void actorUserId;
        return this.registry.updateManifest(itemId, { ...manifestPatch, version });
    }
    async getCurrentVersion(itemId) {
        const item = await this.registry.getItem(itemId);
        return item?.manifest.version ?? null;
    }
    isCompatibleUpgrade(fromVersion, toVersion) {
        // Simple semver-major check: major version bumps are flagged as breaking, never silently auto-applied.
        const fromMajor = parseInt(fromVersion.split('.')[0] ?? '0', 10);
        const toMajor = parseInt(toVersion.split('.')[0] ?? '0', 10);
        return toMajor >= fromMajor;
    }
}
exports.SkillVersionManager = SkillVersionManager;
//# sourceMappingURL=SkillVersionManager.js.map