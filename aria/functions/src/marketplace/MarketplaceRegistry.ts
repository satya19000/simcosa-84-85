import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { MarketplaceItemRecord, SkillManifest, SkillLifecycleStatus, PublisherRecord, CategoryRecord } from './MarketplaceTypes'

const ITEMS_COL = 'marketplace/items/items'
const PUBLISHERS_COL = 'marketplace/publishers/publishers'
const CATEGORIES_COL = 'marketplace/categories/categories'

/**
 * Repository for marketplace/items, marketplace/publishers, marketplace/categories.
 * Public catalog data — no tenant scoping needed here (the catalog itself is
 * global; tenant-scoped installation state lives in SkillInstaller/SkillManager).
 */
export class MarketplaceRegistry {
  constructor(private readonly db: admin.firestore.Firestore) {}

  // ── Items ──────────────────────────────────────────────────────────────

  async createItem(actorUserId: string, manifest: SkillManifest): Promise<MarketplaceItemRecord> {
    const itemId = manifest.id || uuidv4()
    const now = new Date().toISOString()
    const record: MarketplaceItemRecord = {
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
    }
    await this.db.collection(ITEMS_COL).doc(itemId).set(record)
    return record
  }

  async getItem(itemId: string): Promise<MarketplaceItemRecord | null> {
    const snap = await this.db.collection(ITEMS_COL).doc(itemId).get()
    return snap.exists ? (snap.data() as MarketplaceItemRecord) : null
  }

  async updateItemStatus(itemId: string, status: SkillLifecycleStatus): Promise<MarketplaceItemRecord | null> {
    const ref = this.db.collection(ITEMS_COL).doc(itemId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ status, updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as MarketplaceItemRecord
  }

  async updateManifest(itemId: string, manifest: Partial<SkillManifest>): Promise<MarketplaceItemRecord | null> {
    const ref = this.db.collection(ITEMS_COL).doc(itemId)
    const snap = await ref.get()
    if (!snap.exists) return null
    const current = snap.data() as MarketplaceItemRecord
    const merged: SkillManifest = { ...current.manifest, ...manifest, updatedAt: new Date().toISOString() }
    await ref.update({ manifest: merged, updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as MarketplaceItemRecord
  }

  async incrementInstallCount(itemId: string, delta: number): Promise<void> {
    const ref = this.db.collection(ITEMS_COL).doc(itemId)
    const snap = await ref.get()
    if (!snap.exists) return
    const current = snap.data() as MarketplaceItemRecord
    await ref.update({ installCount: Math.max(0, current.installCount + delta), updatedAt: new Date().toISOString() })
  }

  async setRating(itemId: string, ratingAverage: number, ratingCount: number): Promise<void> {
    await this.db.collection(ITEMS_COL).doc(itemId).update({ ratingAverage, ratingCount, updatedAt: new Date().toISOString() })
  }

  async listItems(filters: { category?: string; itemType?: string; status?: SkillLifecycleStatus } = {}): Promise<MarketplaceItemRecord[]> {
    let query: admin.firestore.Query = this.db.collection(ITEMS_COL)
    if (filters.status) query = query.where('status', '==', filters.status)
    const snap = await query.get()
    let items = snap.docs.map((d) => d.data() as MarketplaceItemRecord)
    if (filters.category) items = items.filter((i) => i.manifest.category === filters.category)
    if (filters.itemType) items = items.filter((i) => i.manifest.itemType === filters.itemType)
    return items
  }

  async searchItems(query: string): Promise<MarketplaceItemRecord[]> {
    const all = await this.listItems({ status: 'published' })
    const q = query.toLowerCase()
    return all.filter(
      (i) =>
        i.manifest.name.toLowerCase().includes(q) ||
        i.manifest.description.toLowerCase().includes(q) ||
        i.manifest.capabilities.some((c) => c.toLowerCase().includes(q))
    )
  }

  // ── Publishers ─────────────────────────────────────────────────────────

  async getOrCreatePublisher(userId: string, displayName: string): Promise<PublisherRecord> {
    const snap = await this.db.collection(PUBLISHERS_COL).where('userId', '==', userId).limit(1).get()
    if (!snap.empty) return snap.docs[0].data() as PublisherRecord
    const publisherId = uuidv4()
    const now = new Date().toISOString()
    const record: PublisherRecord = {
      id: publisherId,
      publisherId,
      userId,
      displayName,
      verified: false,
      itemIds: [],
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(PUBLISHERS_COL).doc(publisherId).set(record)
    return record
  }

  async linkItemToPublisher(publisherId: string, itemId: string): Promise<void> {
    const ref = this.db.collection(PUBLISHERS_COL).doc(publisherId)
    const snap = await ref.get()
    if (!snap.exists) return
    const current = snap.data() as PublisherRecord
    if (current.itemIds.includes(itemId)) return
    await ref.update({ itemIds: [...current.itemIds, itemId], updatedAt: new Date().toISOString() })
  }

  // ── Categories ─────────────────────────────────────────────────────────

  async ensureCategory(actorUserId: string, name: CategoryRecord['name'], description: string): Promise<CategoryRecord> {
    const snap = await this.db.collection(CATEGORIES_COL).where('name', '==', name).limit(1).get()
    if (!snap.empty) return snap.docs[0].data() as CategoryRecord
    const categoryId = uuidv4()
    const now = new Date().toISOString()
    const record: CategoryRecord = {
      id: categoryId,
      categoryId,
      name,
      description,
      itemCount: 0,
      createdBy: actorUserId,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(CATEGORIES_COL).doc(categoryId).set(record)
    return record
  }

  async listCategories(): Promise<CategoryRecord[]> {
    const snap = await this.db.collection(CATEGORIES_COL).get()
    return snap.docs.map((d) => d.data() as CategoryRecord)
  }
}
