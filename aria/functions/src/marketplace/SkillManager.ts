import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { MarketplaceItemRecord, SkillManifest, SkillLifecycleStatus } from './MarketplaceTypes'
import { MarketplaceRegistry } from './MarketplaceRegistry'
import { SkillValidator } from './SkillValidator'
import { SkillVersionManager } from './SkillVersionManager'
import { SkillReviewManager } from './SkillReviewManager'
import { MarketplaceLogger } from './MarketplaceLogger'

const ALLOWED_TRANSITIONS: Record<SkillLifecycleStatus, SkillLifecycleStatus[]> = {
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
}

/**
 * Lifecycle management for marketplace skill CRUD/publish/review/version
 * logic: draft -> submitted -> under_review -> approved -> published ->
 * deprecated/removed. Delegates all Firestore I/O to MarketplaceRegistry,
 * manifest validation to SkillValidator, version bumps to
 * SkillVersionManager, and the review workflow to SkillReviewManager —
 * this class holds no raw Firestore calls of its own.
 */
export class SkillManager {
  private readonly versions: SkillVersionManager
  private readonly logger = new MarketplaceLogger()

  constructor(
    _db: admin.firestore.Firestore,
    private readonly registry: MarketplaceRegistry,
    private readonly reviews: SkillReviewManager
  ) {
    this.versions = new SkillVersionManager(registry)
  }

  private assertTransition(from: SkillLifecycleStatus, to: SkillLifecycleStatus): void {
    if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
      throw new Error(`Invalid skill lifecycle transition: "${from}" -> "${to}"`)
    }
  }

  async createDraft(actorUserId: string, manifest: Partial<SkillManifest>): Promise<MarketplaceItemRecord> {
    SkillValidator.validateManifest(manifest)
    const publisher = await this.registry.getOrCreatePublisher(actorUserId, manifest.author ?? actorUserId)
    const fullManifest: SkillManifest = {
      id: manifest.id ?? uuidv4(),
      name: manifest.name!,
      slug: manifest.slug!,
      version: manifest.version!,
      author: manifest.author!,
      publisherId: publisher.publisherId,
      description: manifest.description!,
      category: manifest.category!,
      icon: manifest.icon ?? null,
      screenshots: manifest.screenshots ?? [],
      itemType: manifest.itemType!,
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
    }
    const item = await this.registry.createItem(actorUserId, fullManifest)
    await this.registry.linkItemToPublisher(publisher.publisherId, item.itemId)
    this.logger.info('SkillManager', `Created draft skill "${item.itemId}"`, { actorUserId })
    return item
  }

  async updateDraft(itemId: string, manifestPatch: Partial<SkillManifest>): Promise<MarketplaceItemRecord | null> {
    const item = await this.registry.getItem(itemId)
    if (!item) return null
    if (item.status !== 'draft') {
      throw new Error(`Cannot update skill "${itemId}": status is "${item.status}", expected "draft"`)
    }
    SkillValidator.validateManifest({ ...item.manifest, ...manifestPatch })
    return this.registry.updateManifest(itemId, manifestPatch)
  }

  async submitForReview(itemId: string): Promise<MarketplaceItemRecord | null> {
    const item = await this.registry.getItem(itemId)
    if (!item) return null
    this.assertTransition(item.status, 'submitted')
    const updated = await this.registry.updateItemStatus(itemId, 'submitted')
    return this.registry.updateItemStatus(itemId, 'under_review') ?? updated
  }

  async approve(itemId: string): Promise<MarketplaceItemRecord | null> {
    const item = await this.registry.getItem(itemId)
    if (!item) return null
    this.assertTransition(item.status, 'approved')
    const approved = await this.registry.updateItemStatus(itemId, 'approved')
    if (!approved) return null
    this.assertTransition('approved', 'published')
    return this.registry.updateItemStatus(itemId, 'published')
  }

  async reject(itemId: string): Promise<MarketplaceItemRecord | null> {
    const item = await this.registry.getItem(itemId)
    if (!item) return null
    this.assertTransition(item.status, 'draft')
    return this.registry.updateItemStatus(itemId, 'draft')
  }

  async deprecate(itemId: string): Promise<MarketplaceItemRecord | null> {
    const item = await this.registry.getItem(itemId)
    if (!item) return null
    this.assertTransition(item.status, 'deprecated')
    return this.registry.updateItemStatus(itemId, 'deprecated')
  }

  async publishVersion(actorUserId: string, itemId: string, version: string, manifestPatch: Partial<SkillManifest>): Promise<MarketplaceItemRecord | null> {
    const current = await this.versions.getCurrentVersion(itemId)
    if (current && !this.versions.isCompatibleUpgrade(current, version)) {
      this.logger.warn('SkillManager', `Major version bump for "${itemId}": ${current} -> ${version}`)
    }
    return this.versions.publishVersion(actorUserId, itemId, version, manifestPatch)
  }

  async getSkill(itemId: string): Promise<MarketplaceItemRecord | null> {
    return this.registry.getItem(itemId)
  }

  async submitReview(actorUserId: string, itemId: string, input: { rating: number; reviewText: string; versionReviewed: string }) {
    SkillValidator.validateReview(input)
    return this.reviews.submitReview(actorUserId, itemId, input)
  }

  async listReviews(itemId: string) {
    return this.reviews.listReviews(itemId)
  }
}
