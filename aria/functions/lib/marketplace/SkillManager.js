"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillManager = void 0;
const uuid_1 = require("uuid");
const SkillValidator_1 = require("./SkillValidator");
const SkillVersionManager_1 = require("./SkillVersionManager");
const MarketplaceLogger_1 = require("./MarketplaceLogger");
const ALLOWED_TRANSITIONS = {
    draft: ['submitted', 'removed'],
    submitted: ['under_review', 'draft'],
    under_review: ['approved', 'draft'],
    approved: ['published', 'draft'],
    published: ['deprecated'],
    installed: ['enabled', 'disabled', 'removed'],
    enabled: ['disabled', 'removed'],
    disabled: ['enabled', 'removed'],
    deprecated: ['removed'],
    removed: [],
};
/**
 * Lifecycle management for marketplace skill CRUD/publish/review/version
 * logic: draft -> submitted -> under_review -> approved -> published ->
 * deprecated/removed. Delegates all Firestore I/O to MarketplaceRegistry,
 * manifest validation to SkillValidator, version bumps to
 * SkillVersionManager, and the review workflow to SkillReviewManager —
 * this class holds no raw Firestore calls of its own.
 */
class SkillManager {
    constructor(_db, registry, reviews) {
        this.registry = registry;
        this.reviews = reviews;
        this.logger = new MarketplaceLogger_1.MarketplaceLogger();
        this.versions = new SkillVersionManager_1.SkillVersionManager(registry);
    }
    assertTransition(from, to) {
        if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
            throw new Error(`Invalid skill lifecycle transition: "${from}" -> "${to}"`);
        }
    }
    async createDraft(actorUserId, manifest) {
        SkillValidator_1.SkillValidator.validateManifest(manifest);
        const publisher = await this.registry.getOrCreatePublisher(actorUserId, manifest.author ?? actorUserId);
        const fullManifest = {
            id: manifest.id ?? (0, uuid_1.v4)(),
            name: manifest.name,
            slug: manifest.slug,
            version: manifest.version,
            author: manifest.author,
            publisherId: publisher.publisherId,
            description: manifest.description,
            category: manifest.category,
            icon: manifest.icon ?? null,
            screenshots: manifest.screenshots ?? [],
            itemType: manifest.itemType,
            capabilities: manifest.capabilities ?? [],
            permissions: manifest.permissions ?? [],
            requiredPlugins: manifest.requiredPlugins ?? [],
            requiredEngines: manifest.requiredEngines ?? [],
            compatibleVersions: manifest.compatibleVersions ?? [],
            pricingModel: manifest.pricingModel ?? 'free',
            installationType: manifest.installationType ?? 'tenant',
            securityLevel: manifest.securityLevel ?? 'low',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const item = await this.registry.createItem(actorUserId, fullManifest);
        await this.registry.linkItemToPublisher(publisher.publisherId, item.itemId);
        this.logger.info('SkillManager', `Created draft skill "${item.itemId}"`, { actorUserId });
        return item;
    }
    async updateDraft(itemId, manifestPatch) {
        const item = await this.registry.getItem(itemId);
        if (!item)
            return null;
        if (item.status !== 'draft') {
            throw new Error(`Cannot update skill "${itemId}": status is "${item.status}", expected "draft"`);
        }
        SkillValidator_1.SkillValidator.validateManifest({ ...item.manifest, ...manifestPatch });
        return this.registry.updateManifest(itemId, manifestPatch);
    }
    async submitForReview(itemId) {
        const item = await this.registry.getItem(itemId);
        if (!item)
            return null;
        this.assertTransition(item.status, 'submitted');
        const updated = await this.registry.updateItemStatus(itemId, 'submitted');
        return this.registry.updateItemStatus(itemId, 'under_review') ?? updated;
    }
    async approve(itemId) {
        const item = await this.registry.getItem(itemId);
        if (!item)
            return null;
        this.assertTransition(item.status, 'approved');
        const approved = await this.registry.updateItemStatus(itemId, 'approved');
        if (!approved)
            return null;
        this.assertTransition('approved', 'published');
        return this.registry.updateItemStatus(itemId, 'published');
    }
    async reject(itemId) {
        const item = await this.registry.getItem(itemId);
        if (!item)
            return null;
        this.assertTransition(item.status, 'draft');
        return this.registry.updateItemStatus(itemId, 'draft');
    }
    async deprecate(itemId) {
        const item = await this.registry.getItem(itemId);
        if (!item)
            return null;
        this.assertTransition(item.status, 'deprecated');
        return this.registry.updateItemStatus(itemId, 'deprecated');
    }
    async publishVersion(actorUserId, itemId, version, manifestPatch) {
        const current = await this.versions.getCurrentVersion(itemId);
        if (current && !this.versions.isCompatibleUpgrade(current, version)) {
            this.logger.warn('SkillManager', `Major version bump for "${itemId}": ${current} -> ${version}`);
        }
        return this.versions.publishVersion(actorUserId, itemId, version, manifestPatch);
    }
    async getSkill(itemId) {
        return this.registry.getItem(itemId);
    }
    async submitReview(actorUserId, itemId, input) {
        SkillValidator_1.SkillValidator.validateReview(input);
        return this.reviews.submitReview(actorUserId, itemId, input);
    }
    async listReviews(itemId) {
        return this.reviews.listReviews(itemId);
    }
}
exports.SkillManager = SkillManager;
//# sourceMappingURL=SkillManager.js.map