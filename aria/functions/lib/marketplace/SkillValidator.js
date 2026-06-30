"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillValidator = exports.SkillValidationError = void 0;
const MarketplaceTypes_1 = require("./MarketplaceTypes");
class SkillValidationError extends Error {
    constructor(field, reason) {
        super(`Validation failed for '${field}': ${reason}`);
        this.name = 'SkillValidationError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.SkillValidationError = SkillValidationError;
/** Static input validators for SkillManifest, used by SkillInstaller step 1 and marketplaceApi.ts. */
class SkillValidator {
    static validateManifest(manifest) {
        if (!manifest.name || typeof manifest.name !== 'string' || !manifest.name.trim()) {
            throw new SkillValidationError('name', 'must be a non-empty string');
        }
        if (!manifest.slug || typeof manifest.slug !== 'string' || !/^[a-z0-9-]+$/.test(manifest.slug)) {
            throw new SkillValidationError('slug', 'must be a non-empty lowercase, dash-separated string');
        }
        if (!manifest.version || typeof manifest.version !== 'string') {
            throw new SkillValidationError('version', 'must be a non-empty semver-style string');
        }
        if (!manifest.author || typeof manifest.author !== 'string') {
            throw new SkillValidationError('author', 'must be a non-empty string');
        }
        if (!manifest.publisherId || typeof manifest.publisherId !== 'string') {
            throw new SkillValidationError('publisherId', 'must be a non-empty string');
        }
        if (!manifest.description || typeof manifest.description !== 'string') {
            throw new SkillValidationError('description', 'must be a non-empty string');
        }
        if (!manifest.category || !MarketplaceTypes_1.MARKETPLACE_CATEGORIES.includes(manifest.category)) {
            throw new SkillValidationError('category', `must be one of: ${MarketplaceTypes_1.MARKETPLACE_CATEGORIES.join(', ')}`);
        }
        if (!manifest.itemType || !MarketplaceTypes_1.MARKETPLACE_ITEM_TYPES.includes(manifest.itemType)) {
            throw new SkillValidationError('itemType', `must be one of: ${MarketplaceTypes_1.MARKETPLACE_ITEM_TYPES.join(', ')}`);
        }
        if (!Array.isArray(manifest.permissions) || manifest.permissions.some((p) => !MarketplaceTypes_1.SKILL_PERMISSION_SCOPES.includes(p))) {
            throw new SkillValidationError('permissions', `must be an array of valid permission scopes: ${MarketplaceTypes_1.SKILL_PERMISSION_SCOPES.join(', ')}`);
        }
        if (manifest.requiredPlugins !== undefined && !Array.isArray(manifest.requiredPlugins)) {
            throw new SkillValidationError('requiredPlugins', 'must be an array of plugin ids if provided');
        }
        if (manifest.requiredEngines !== undefined && !Array.isArray(manifest.requiredEngines)) {
            throw new SkillValidationError('requiredEngines', 'must be an array of engine names if provided');
        }
        if (manifest.installationType && !['tenant', 'organization', 'personal'].includes(manifest.installationType)) {
            throw new SkillValidationError('installationType', 'must be one of: tenant, organization, personal');
        }
        if (manifest.pricingModel && !['free', 'one_time', 'subscription', 'usage_based'].includes(manifest.pricingModel)) {
            throw new SkillValidationError('pricingModel', 'must be one of: free, one_time, subscription, usage_based');
        }
    }
    static validateReview(input) {
        if (typeof input.rating !== 'number' || input.rating < 1 || input.rating > 5) {
            throw new SkillValidationError('rating', 'must be a number between 1 and 5');
        }
        if (typeof input.reviewText !== 'string' || input.reviewText.length > 4000) {
            throw new SkillValidationError('reviewText', 'must be a string of 4000 characters or fewer');
        }
    }
}
exports.SkillValidator = SkillValidator;
//# sourceMappingURL=SkillValidator.js.map