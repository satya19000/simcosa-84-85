"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceEngine = void 0;
const MarketplaceRegistry_1 = require("./MarketplaceRegistry");
const SkillManager_1 = require("./SkillManager");
const SkillInstaller_1 = require("./SkillInstaller");
const SkillCatalog_1 = require("./SkillCatalog");
const SkillReviewManager_1 = require("./SkillReviewManager");
const SkillPermissions_1 = require("./SkillPermissions");
const SkillAnalytics_1 = require("./SkillAnalytics");
const SkillVersionManager_1 = require("./SkillVersionManager");
const SkillValidator_1 = require("./SkillValidator");
const SkillCompatibility_1 = require("./SkillCompatibility");
const SkillDependencyResolver_1 = require("./SkillDependencyResolver");
const SkillSecurityScanner_1 = require("./SkillSecurityScanner");
const SkillBilling_1 = require("./SkillBilling");
const SkillNotifications_1 = require("./SkillNotifications");
const SkillEvents_1 = require("./SkillEvents");
const MarketplaceLogger_1 = require("./MarketplaceLogger");
const MarketplaceConfig_1 = require("./MarketplaceConfig");
/**
 * Facade for the AI Marketplace & Skills Ecosystem. Composes the
 * Manager/Skill* classes and exposes the high-level methods the Cloud
 * Functions API layer (marketplaceApi.ts) and Action Engine actions call.
 * Holds no Firestore writes of its own — every mutation delegates to a
 * composed class.
 */
class MarketplaceEngine {
    constructor(db, config, apiKey, tenants, rbac, approvalEngine, pluginRuntime) {
        this.db = db;
        this.config = config;
        this.apiKey = apiKey;
        this.tenants = tenants;
        this.rbac = rbac;
        this.approvalEngine = approvalEngine;
        this.pluginRuntime = pluginRuntime;
        this.dependencies = new SkillDependencyResolver_1.SkillDependencyResolver();
        this.scanner = new SkillSecurityScanner_1.SkillSecurityScanner();
        this.billing = new SkillBilling_1.SkillBilling();
        this.notifications = new SkillNotifications_1.SkillNotifications();
        this.events = new SkillEvents_1.SkillEvents();
        this.logger = new MarketplaceLogger_1.MarketplaceLogger();
        void this.apiKey;
        void this.db;
        this.registry = new MarketplaceRegistry_1.MarketplaceRegistry(db);
        this.reviews = new SkillReviewManager_1.SkillReviewManager(db, this.registry);
        this.manager = new SkillManager_1.SkillManager(db, this.registry, this.reviews);
        this.catalog = new SkillCatalog_1.SkillCatalog(this.registry);
        this.installer = new SkillInstaller_1.SkillInstaller(db, this.registry, this.tenants, this.rbac, this.approvalEngine, this.pluginRuntime, this.config ?? MarketplaceConfig_1.DEFAULT_MARKETPLACE_CONFIG);
        this.permissions = new SkillPermissions_1.SkillPermissions(db, this.rbac);
        this.analytics = new SkillAnalytics_1.SkillAnalytics(db, this.registry);
        this.versions = new SkillVersionManager_1.SkillVersionManager(this.registry);
        this.compatibility = new SkillCompatibility_1.SkillCompatibility(db, this.tenants);
    }
    // ── Publishing ────────────────────────────────────────────────────────
    async publish(actorUserId, manifest) {
        return this.manager.createDraft(actorUserId, manifest);
    }
    async updateSkill(itemId, manifestPatch) {
        return this.manager.updateDraft(itemId, manifestPatch);
    }
    async submitForReview(itemId) {
        return this.manager.submitForReview(itemId);
    }
    async approve(itemId) {
        return this.manager.approve(itemId);
    }
    async reject(itemId) {
        return this.manager.reject(itemId);
    }
    // ── Installation ──────────────────────────────────────────────────────
    async install(actorUserId, input) {
        return this.installer.install(actorUserId, input);
    }
    async uninstall(actorUserId, tenantId, installationId) {
        return this.installer.uninstall(actorUserId, tenantId, installationId);
    }
    async enable(actorUserId, tenantId, installationId) {
        return this.installer.enable(actorUserId, tenantId, installationId);
    }
    async disable(actorUserId, tenantId, installationId) {
        return this.installer.disable(actorUserId, tenantId, installationId);
    }
    async listInstalled(actorUserId, tenantId) {
        return this.installer.listInstalled(actorUserId, tenantId);
    }
    // ── Catalog ───────────────────────────────────────────────────────────
    async listCatalog(filters, page, pageSize) {
        return this.catalog.browse(filters, page, pageSize);
    }
    async getSkillDetail(itemId) {
        return this.catalog.getDetail(itemId);
    }
    // ── Permissions ───────────────────────────────────────────────────────
    async grantPermission(tenantId, actorUserId, installationId, itemId, scopes) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        return this.permissions.recordGrants(tenantId, actorUserId, installationId, itemId, scopes);
    }
    async revokePermission(tenantId, actorUserId, permissionId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        return this.permissions.revokeGrant(tenantId, permissionId);
    }
    // ── Reviews ───────────────────────────────────────────────────────────
    async recordReview(actorUserId, itemId, input) {
        SkillValidator_1.SkillValidator.validateReview(input);
        return this.manager.submitReview(actorUserId, itemId, input);
    }
    async listReviews(itemId) {
        return this.manager.listReviews(itemId);
    }
    // ── Analytics ─────────────────────────────────────────────────────────
    async getAnalytics(itemId) {
        return this.analytics.getSnapshot(itemId);
    }
    // ── Logging passthrough (used by marketplaceApi.ts error mapping) ──────
    get log() {
        return this.logger;
    }
}
exports.MarketplaceEngine = MarketplaceEngine;
//# sourceMappingURL=MarketplaceEngine.js.map