"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillCatalog = void 0;
/**
 * Read-side catalog browsing/search/filtering over MarketplaceItemRecord.
 * Wraps MarketplaceRegistry — no raw Firestore calls here. Only ever
 * surfaces `published` items to the public catalog (drafts/under_review
 * items are visible only via SkillManager/MarketplaceEngine admin paths).
 */
class SkillCatalog {
    constructor(registry) {
        this.registry = registry;
    }
    async browse(filters, page = 1, pageSize = 20) {
        const status = 'published';
        let items = filters.search
            ? await this.registry.searchItems(filters.search)
            : await this.registry.listItems({ category: filters.category, itemType: filters.itemType, status });
        if (filters.pricingModel) {
            items = items.filter((i) => i.manifest.pricingModel === filters.pricingModel);
        }
        const total = items.length;
        const start = Math.max(0, (page - 1) * pageSize);
        const paged = items.slice(start, start + pageSize);
        return { items: paged, total, page, pageSize };
    }
    async getDetail(itemId) {
        return this.registry.getItem(itemId);
    }
    async listCategories() {
        return this.registry.listCategories();
    }
}
exports.SkillCatalog = SkillCatalog;
//# sourceMappingURL=SkillCatalog.js.map