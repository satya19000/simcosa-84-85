"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceRegistry = void 0;
const uuid_1 = require("uuid");
const ITEMS_COL = 'marketplace/items/items';
const PUBLISHERS_COL = 'marketplace/publishers/publishers';
const CATEGORIES_COL = 'marketplace/categories/categories';
/**
 * Repository for marketplace/items, marketplace/publishers, marketplace/categories.
 * Public catalog data — no tenant scoping needed here (the catalog itself is
 * global; tenant-scoped installation state lives in SkillInstaller/SkillManager).
 */
class MarketplaceRegistry {
    constructor(db) {
        this.db = db;
    }
    // ── Items ──────────────────────────────────────────────────────────────
    async createItem(actorUserId, manifest) {
        const itemId = manifest.id || (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
            id: itemId,
            itemId,
            manifest: { ...manifest, id: itemId, createdAt: manifest.createdAt || now, updatedAt: now },
            status: 'draft',
            installCount: 0,
            ratingAverage: 0,
            ratingCount: 0,
            createdBy: actorUserId,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(ITEMS_COL).doc(itemId).set(record);
        return record;
    }
    async getItem(itemId) {
        const snap = await this.db.collection(ITEMS_COL).doc(itemId).get();
        return snap.exists ? snap.data() : null;
    }
    async updateItemStatus(itemId, status) {
        const ref = this.db.collection(ITEMS_COL).doc(itemId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ status, updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
    async updateManifest(itemId, manifest) {
        const ref = this.db.collection(ITEMS_COL).doc(itemId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        const current = snap.data();
        const merged = { ...current.manifest, ...manifest, updatedAt: new Date().toISOString() };
        await ref.update({ manifest: merged, updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        return updated.data();
    }
    async incrementInstallCount(itemId, delta) {
        const ref = this.db.collection(ITEMS_COL).doc(itemId);
        const snap = await ref.get();
        if (!snap.exists)
            return;
        const current = snap.data();
        await ref.update({ installCount: Math.max(0, current.installCount + delta), updatedAt: new Date().toISOString() });
    }
    async setRating(itemId, ratingAverage, ratingCount) {
        await this.db.collection(ITEMS_COL).doc(itemId).update({ ratingAverage, ratingCount, updatedAt: new Date().toISOString() });
    }
    async listItems(filters = {}) {
        let query = this.db.collection(ITEMS_COL);
        if (filters.status)
            query = query.where('status', '==', filters.status);
        const snap = await query.get();
        let items = snap.docs.map((d) => d.data());
        if (filters.category)
            items = items.filter((i) => i.manifest.category === filters.category);
        if (filters.itemType)
            items = items.filter((i) => i.manifest.itemType === filters.itemType);
        return items;
    }
    async searchItems(query) {
        const all = await this.listItems({ status: 'published' });
        const q = query.toLowerCase();
        return all.filter((i) => i.manifest.name.toLowerCase().includes(q) ||
            i.manifest.description.toLowerCase().includes(q) ||
            i.manifest.capabilities.some((c) => c.toLowerCase().includes(q)));
    }
    // ── Publishers ─────────────────────────────────────────────────────────
    async getOrCreatePublisher(userId, displayName) {
        const snap = await this.db.collection(PUBLISHERS_COL).where('userId', '==', userId).limit(1).get();
        if (!snap.empty)
            return snap.docs[0].data();
        const publisherId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
            id: publisherId,
            publisherId,
            userId,
            displayName,
            verified: false,
            itemIds: [],
            createdBy: userId,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(PUBLISHERS_COL).doc(publisherId).set(record);
        return record;
    }
    async linkItemToPublisher(publisherId, itemId) {
        const ref = this.db.collection(PUBLISHERS_COL).doc(publisherId);
        const snap = await ref.get();
        if (!snap.exists)
            return;
        const current = snap.data();
        if (current.itemIds.includes(itemId))
            return;
        await ref.update({ itemIds: [...current.itemIds, itemId], updatedAt: new Date().toISOString() });
    }
    // ── Categories ─────────────────────────────────────────────────────────
    async ensureCategory(actorUserId, name, description) {
        const snap = await this.db.collection(CATEGORIES_COL).where('name', '==', name).limit(1).get();
        if (!snap.empty)
            return snap.docs[0].data();
        const categoryId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
            id: categoryId,
            categoryId,
            name,
            description,
            itemCount: 0,
            createdBy: actorUserId,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(CATEGORIES_COL).doc(categoryId).set(record);
        return record;
    }
    async listCategories() {
        const snap = await this.db.collection(CATEGORIES_COL).get();
        return snap.docs.map((d) => d.data());
    }
}
exports.MarketplaceRegistry = MarketplaceRegistry;
//# sourceMappingURL=MarketplaceRegistry.js.map