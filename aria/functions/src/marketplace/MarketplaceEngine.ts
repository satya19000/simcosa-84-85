import type * as admin from 'firebase-admin'
import type { TenantEngine } from '../security/TenantEngine'
import type { RBACEngine } from '../security/RBACEngine'
import type { ApprovalEngine } from '../delegation/ApprovalEngine'
import type { PluginRuntime } from '../plugins/PluginRuntime'
import type { SkillManifest, SkillPermissionScope } from './MarketplaceTypes'
import { MarketplaceRegistry } from './MarketplaceRegistry'
import { SkillManager } from './SkillManager'
import { SkillInstaller, type InstallSkillInput } from './SkillInstaller'
import { SkillCatalog, type CatalogFilters } from './SkillCatalog'
import { SkillReviewManager } from './SkillReviewManager'
import { SkillPermissions } from './SkillPermissions'
import { SkillAnalytics } from './SkillAnalytics'
import { SkillVersionManager } from './SkillVersionManager'
import { SkillValidator } from './SkillValidator'
import { SkillCompatibility } from './SkillCompatibility'
import { SkillDependencyResolver } from './SkillDependencyResolver'
import { SkillSecurityScanner } from './SkillSecurityScanner'
import { SkillBilling } from './SkillBilling'
import { SkillNotifications } from './SkillNotifications'
import { SkillEvents } from './SkillEvents'
import { MarketplaceLogger } from './MarketplaceLogger'
import { DEFAULT_MARKETPLACE_CONFIG, type MarketplaceConfig } from './MarketplaceConfig'

/**
 * Facade for the AI Marketplace & Skills Ecosystem. Composes the
 * Manager/Skill* classes and exposes the high-level methods the Cloud
 * Functions API layer (marketplaceApi.ts) and Action Engine actions call.
 * Holds no Firestore writes of its own — every mutation delegates to a
 * composed class.
 */
export class MarketplaceEngine {
  readonly registry: MarketplaceRegistry
  readonly reviews: SkillReviewManager
  readonly manager: SkillManager
  readonly catalog: SkillCatalog
  readonly installer: SkillInstaller
  readonly permissions: SkillPermissions
  readonly analytics: SkillAnalytics
  readonly versions: SkillVersionManager
  readonly compatibility: SkillCompatibility
  readonly dependencies = new SkillDependencyResolver()
  readonly scanner = new SkillSecurityScanner()
  readonly billing = new SkillBilling()
  readonly notifications = new SkillNotifications()
  readonly events = new SkillEvents()
  private readonly logger = new MarketplaceLogger()

  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly config: MarketplaceConfig,
    private readonly apiKey: string,
    private readonly tenants: TenantEngine,
    private readonly rbac: RBACEngine,
    private readonly approvalEngine: ApprovalEngine,
    private readonly pluginRuntime: PluginRuntime
  ) {
    void this.apiKey
    void this.db
    this.registry = new MarketplaceRegistry(db)
    this.reviews = new SkillReviewManager(db, this.registry)
    this.manager = new SkillManager(db, this.registry, this.reviews)
    this.catalog = new SkillCatalog(this.registry)
    this.installer = new SkillInstaller(db, this.registry, this.tenants, this.rbac, this.approvalEngine, this.pluginRuntime, this.config ?? DEFAULT_MARKETPLACE_CONFIG)
    this.permissions = new SkillPermissions(db, this.rbac)
    this.analytics = new SkillAnalytics(db, this.registry)
    this.versions = new SkillVersionManager(this.registry)
    this.compatibility = new SkillCompatibility(db, this.tenants)
  }

  // ── Publishing ────────────────────────────────────────────────────────

  async publish(actorUserId: string, manifest: Partial<SkillManifest>) {
    return this.manager.createDraft(actorUserId, manifest)
  }

  async updateSkill(itemId: string, manifestPatch: Partial<SkillManifest>) {
    return this.manager.updateDraft(itemId, manifestPatch)
  }

  async submitForReview(itemId: string) {
    return this.manager.submitForReview(itemId)
  }

  async approve(itemId: string) {
    return this.manager.approve(itemId)
  }

  async reject(itemId: string) {
    return this.manager.reject(itemId)
  }

  // ── Installation ──────────────────────────────────────────────────────

  async install(actorUserId: string, input: InstallSkillInput) {
    return this.installer.install(actorUserId, input)
  }

  async uninstall(actorUserId: string, tenantId: string, installationId: string) {
    return this.installer.uninstall(actorUserId, tenantId, installationId)
  }

  async enable(actorUserId: string, tenantId: string, installationId: string) {
    return this.installer.enable(actorUserId, tenantId, installationId)
  }

  async disable(actorUserId: string, tenantId: string, installationId: string) {
    return this.installer.disable(actorUserId, tenantId, installationId)
  }

  async listInstalled(actorUserId: string, tenantId: string) {
    return this.installer.listInstalled(actorUserId, tenantId)
  }

  // ── Catalog ───────────────────────────────────────────────────────────

  async listCatalog(filters: CatalogFilters, page?: number, pageSize?: number) {
    return this.catalog.browse(filters, page, pageSize)
  }

  async getSkillDetail(itemId: string) {
    return this.catalog.getDetail(itemId)
  }

  // ── Permissions ───────────────────────────────────────────────────────

  async grantPermission(tenantId: string, actorUserId: string, installationId: string, itemId: string, scopes: SkillPermissionScope[]) {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    return this.permissions.recordGrants(tenantId, actorUserId, installationId, itemId, scopes)
  }

  async revokePermission(tenantId: string, actorUserId: string, permissionId: string) {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    return this.permissions.revokeGrant(tenantId, permissionId)
  }

  // ── Reviews ───────────────────────────────────────────────────────────

  async recordReview(actorUserId: string, itemId: string, input: { rating: number; reviewText: string; versionReviewed: string }) {
    SkillValidator.validateReview(input)
    return this.manager.submitReview(actorUserId, itemId, input)
  }

  async listReviews(itemId: string) {
    return this.manager.listReviews(itemId)
  }

  // ── Analytics ─────────────────────────────────────────────────────────

  async getAnalytics(itemId: string) {
    return this.analytics.getSnapshot(itemId)
  }

  // ── Logging passthrough (used by marketplaceApi.ts error mapping) ──────

  get log(): MarketplaceLogger {
    return this.logger
  }
}
