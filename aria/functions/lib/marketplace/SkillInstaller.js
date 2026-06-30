"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillInstaller = void 0;
const uuid_1 = require("uuid");
const SkillValidator_1 = require("./SkillValidator");
const SkillCompatibility_1 = require("./SkillCompatibility");
const SkillDependencyResolver_1 = require("./SkillDependencyResolver");
const SkillSecurityScanner_1 = require("./SkillSecurityScanner");
const SkillPermissions_1 = require("./SkillPermissions");
const SkillBilling_1 = require("./SkillBilling");
const SkillAnalytics_1 = require("./SkillAnalytics");
const SkillEvents_1 = require("./SkillEvents");
const MarketplaceLogger_1 = require("./MarketplaceLogger");
const MarketplaceConfig_1 = require("./MarketplaceConfig");
const INSTALLED_SKILLS_COL = (tenantId) => `tenants/${tenantId}/installedSkills`;
const SKILL_AUDIT_COL = (tenantId) => `tenants/${tenantId}/skillAudit`;
/**
 * THE CRITICAL FILE — runs the 11-step skill installation lifecycle.
 *
 * No-bypass invariant: the only path from "this install needs approval" to
 * an actual ApprovalRequest is the real `ApprovalEngine.createApprovalRequest`
 * (step 6), mirroring PolicyEngine.requestApprovalForPolicy /
 * DelegationManager.requestApprovalForTask exactly. This class never
 * invents a parallel approval mechanism, never marks an install "approved"
 * itself, and never proceeds past step 6 while a medium/high-risk install's
 * approval is pending.
 *
 * No cross-tenant access: every method verifies tenant membership via the
 * real `TenantEngine.requireIdentity` before any tenant-scoped read/write.
 *
 * No duplicated RBAC: permission checks for installing skills delegate to
 * `SkillPermissions.requireCanInstall`, which itself delegates to the real
 * `RBACEngine.requirePermission` — never reimplemented here.
 */
class SkillInstaller {
    constructor(db, registry, tenants, rbac, approvalEngine, pluginRuntime, config = MarketplaceConfig_1.DEFAULT_MARKETPLACE_CONFIG) {
        this.db = db;
        this.registry = registry;
        this.tenants = tenants;
        this.rbac = rbac;
        this.approvalEngine = approvalEngine;
        this.pluginRuntime = pluginRuntime;
        this.config = config;
        this.dependencies = new SkillDependencyResolver_1.SkillDependencyResolver();
        this.scanner = new SkillSecurityScanner_1.SkillSecurityScanner();
        this.billing = new SkillBilling_1.SkillBilling();
        this.events = new SkillEvents_1.SkillEvents();
        this.logger = new MarketplaceLogger_1.MarketplaceLogger();
        this.compatibility = new SkillCompatibility_1.SkillCompatibility(db, tenants);
        this.permissions = new SkillPermissions_1.SkillPermissions(db, rbac);
        this.analytics = new SkillAnalytics_1.SkillAnalytics(db, registry);
        void this.rbac;
    }
    // ── Install — the 11-step pipeline ─────────────────────────────────────
    async install(actorUserId, input) {
        const { tenantId, itemId } = input;
        const organizationId = input.organizationId ?? null;
        // Tenant membership gate — verified BEFORE any tenant-scoped read/write,
        // mirroring TenantEngine's hard invariant. No cross-tenant access.
        await this.tenants.requireIdentity(tenantId, actorUserId);
        await this.permissions.requireCanInstall(tenantId, actorUserId);
        const item = await this.registry.getItem(itemId);
        if (!item)
            throw new Error(`Marketplace item "${itemId}" not found`);
        if (item.status !== 'published') {
            throw new Error(`Marketplace item "${itemId}" is not published (status: "${item.status}")`);
        }
        const manifest = item.manifest;
        // ── Step 1: Validate manifest ────────────────────────────────────────
        SkillValidator_1.SkillValidator.validateManifest(manifest);
        const installedPlugins = await this.getInstalledPluginIds();
        // ── Step 2: Check tenant/org compatibility ───────────────────────────
        const compat = await this.compatibility.checkCompatibility(tenantId, actorUserId, manifest, installedPlugins);
        if (!compat.compatible) {
            throw new Error(`Skill "${itemId}" is not compatible with tenant "${tenantId}": ${compat.reasons.join('; ')}`);
        }
        const billing = this.billing.checkEligibility(manifest);
        if (!billing.eligible) {
            throw new Error(`Skill "${itemId}" cannot be installed: ${billing.reason}`);
        }
        // ── Step 3: Check required permissions via the real RBAC/Policy layer ─
        // (requireCanInstall already verified above; per-scope grants are
        // recorded in step 7 after a successful/approved install.)
        // ── Step 4: Check dependencies ────────────────────────────────────────
        const depResult = this.dependencies.resolve(manifest, installedPlugins);
        if (!depResult.resolved) {
            throw new Error(`Skill "${itemId}" has unresolved dependencies: missing plugins [${depResult.missingPlugins.join(', ')}], missing engines [${depResult.missingEngines.join(', ')}]`);
        }
        // ── Step 5: Run security scan (existing structured placeholder) ───────
        const missingDepCount = depResult.missingPlugins.length + depResult.missingEngines.length;
        const scan = this.scanner.scan(manifest, missingDepCount);
        if (scan.score >= this.config.blockedScoreThreshold) {
            throw new Error(`Skill "${itemId}" blocked: security scan score ${scan.score} >= block threshold ${this.config.blockedScoreThreshold}. Reasons: ${scan.reasons.join('; ')}`);
        }
        const installationId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const needsApproval = scan.score >= this.config.approvalRequiredScoreThreshold || SkillPermissions_1.SkillPermissions.hasHighRiskScope(manifest.permissions);
        let approvalRequestId = null;
        let status = 'installed';
        // ── Step 6: If risk is medium/high, request approval via the REAL ────
        // ApprovalEngine.createApprovalRequest. Mirrors PolicyEngine's
        // requestApprovalForPolicy / DelegationManager's requestApprovalForTask
        // no-bypass bridge pattern exactly — never a parallel mechanism.
        if (needsApproval) {
            const approval = await this.approvalEngine.createApprovalRequest(actorUserId, {
                title: `Install skill: ${manifest.name}`,
                summary: `Install "${manifest.name}" v${manifest.version} into tenant ${tenantId}`,
                reason: `Security scan risk level "${scan.riskLevel}" (score ${scan.score}); requested permissions: ${manifest.permissions.join(', ')}`,
                triggerType: 'plugin_installation',
                actions: [{ id: installationId, description: `Install marketplace skill "${itemId}"`, target: itemId }],
                rollbackPlan: `Uninstall skill installation "${installationId}" from tenant "${tenantId}"`,
                riskFactors: {
                    externalCommunication: manifest.permissions.some((p) => p.startsWith('send.')),
                    financialImpact: manifest.permissions.includes('read.finance') || manifest.permissions.includes('write.finance') ? 0.5 : 0,
                    healthImpact: manifest.permissions.includes('read.health') || manifest.permissions.includes('write.health'),
                    privacyImpact: manifest.permissions.includes('read.documents') || manifest.permissions.includes('read.contacts'),
                    irreversible: false,
                    aiConfidence: 1 - scan.score / 100,
                },
                createdBy: actorUserId,
            });
            approvalRequestId = approval.id;
            // The install must NOT proceed past this step until approved — if the
            // request is not in 'approved' status (i.e. it is genuinely pending),
            // persist a pending installation record and return early.
            if (approval.status !== 'approved') {
                status = 'submitted';
                const pendingRecord = await this.writeInstallationRecord(tenantId, organizationId, installationId, itemId, manifest.version, status, null, approvalRequestId, scan.score, scan.riskLevel, [], actorUserId, now);
                await this.writeAuditEvent(tenantId, organizationId, actorUserId, itemId, installationId, 'skill.install_pending_approval', scan.riskLevel, null, pendingRecord);
                this.events.emit('skill:install_pending_approval', actorUserId, itemId, installationId, { approvalRequestId });
                return pendingRecord;
            }
        }
        // ── Step 7: Install skill — write installation record ────────────────
        let installedPluginId = null;
        // ── Step 8: Register with Plugin Framework (real PluginRuntime.loadPlugin)
        const factory = input.installedPluginFactory;
        if (factory) {
            const plugin = factory();
            if (plugin) {
                await this.pluginRuntime.loadPlugin(plugin, actorUserId);
                installedPluginId = plugin.manifest.id;
            }
        }
        const record = await this.writeInstallationRecord(tenantId, organizationId, installationId, itemId, manifest.version, 'installed', installedPluginId, approvalRequestId, scan.score, scan.riskLevel, manifest.permissions, actorUserId, now);
        // ── Step 9: Register actions/tools/workflows/agents declared by the ───
        // manifest. Best-effort hook into the action-engine registry — the
        // registry self-registers actions at module load time, so this step
        // simply records which capabilities/tools the manifest declared rather
        // than dynamically constructing new BaseAction instances (out of scope
        // for declarative-manifest-only skills today).
        this.registerDeclaredCapabilities(manifest.capabilities, installationId);
        // ── Step 10: Write audit event (SkillAuditRecord shape, append-only) ──
        await this.writeAuditEvent(tenantId, organizationId, actorUserId, itemId, installationId, 'skill.installed', scan.riskLevel, null, record);
        // ── Step 11: Update marketplace analytics ─────────────────────────────
        await this.registry.incrementInstallCount(itemId, 1);
        await this.analytics.recordUsage(tenantId, actorUserId, { installationId, itemId, eventType: 'enabled', detail: 'installed' });
        this.events.emit('skill:installed', actorUserId, itemId, installationId, { tenantId });
        return record;
    }
    async uninstall(actorUserId, tenantId, installationId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const ref = this.db.collection(INSTALLED_SKILLS_COL(tenantId)).doc(installationId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        const current = snap.data();
        if (current.installedPluginId) {
            await this.pluginRuntime.unloadPlugin(current.installedPluginId);
        }
        await ref.update({ status: 'removed', updatedAt: new Date().toISOString() });
        const updated = (await ref.get()).data();
        await this.registry.incrementInstallCount(current.itemId, -1);
        await this.writeAuditEvent(tenantId, current.organizationId, actorUserId, current.itemId, installationId, 'skill.uninstalled', current.securityScanRiskLevel, current, updated);
        this.events.emit('skill:uninstalled', actorUserId, current.itemId, installationId, { tenantId });
        return updated;
    }
    async enable(actorUserId, tenantId, installationId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const updated = await this.setStatus(tenantId, installationId, 'enabled');
        if (updated) {
            await this.analytics.recordUsage(tenantId, actorUserId, { installationId, itemId: updated.itemId, eventType: 'enabled', detail: null });
            await this.writeAuditEvent(tenantId, updated.organizationId, actorUserId, updated.itemId, installationId, 'skill.enabled', updated.securityScanRiskLevel, null, updated);
            this.events.emit('skill:enabled', actorUserId, updated.itemId, installationId, { tenantId });
        }
        return updated;
    }
    async disable(actorUserId, tenantId, installationId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const updated = await this.setStatus(tenantId, installationId, 'disabled');
        if (updated) {
            await this.analytics.recordUsage(tenantId, actorUserId, { installationId, itemId: updated.itemId, eventType: 'disabled', detail: null });
            await this.writeAuditEvent(tenantId, updated.organizationId, actorUserId, updated.itemId, installationId, 'skill.disabled', updated.securityScanRiskLevel, null, updated);
            this.events.emit('skill:disabled', actorUserId, updated.itemId, installationId, { tenantId });
        }
        return updated;
    }
    async listInstalled(actorUserId, tenantId) {
        await this.tenants.requireIdentity(tenantId, actorUserId);
        const snap = await this.db.collection(INSTALLED_SKILLS_COL(tenantId)).get();
        return snap.docs.map((d) => d.data());
    }
    // ── Internal helpers — the only Firestore writes in this class ─────────
    async setStatus(tenantId, installationId, status) {
        const ref = this.db.collection(INSTALLED_SKILLS_COL(tenantId)).doc(installationId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ status, updatedAt: new Date().toISOString() });
        return (await ref.get()).data();
    }
    async writeInstallationRecord(tenantId, organizationId, installationId, itemId, manifestVersion, status, installedPluginId, approvalRequestId, securityScanScore, securityScanRiskLevel, grantedPermissions, actorUserId, now) {
        const record = {
            id: installationId,
            installationId,
            tenantId,
            organizationId,
            itemId,
            manifestVersion,
            status,
            installedPluginId,
            approvalRequestId,
            securityScanScore,
            securityScanRiskLevel,
            grantedPermissions,
            createdBy: actorUserId,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(INSTALLED_SKILLS_COL(tenantId)).doc(installationId).set(record);
        if (grantedPermissions.length > 0) {
            await this.permissions.recordGrants(tenantId, actorUserId, installationId, itemId, grantedPermissions);
        }
        return record;
    }
    async writeAuditEvent(tenantId, organizationId, actorId, itemId, installationId, action, riskLevel, before, after) {
        const auditId = (0, uuid_1.v4)();
        const record = {
            id: auditId,
            auditId,
            tenantId,
            organizationId,
            actorId,
            itemId,
            installationId,
            action,
            resource: `tenants/${tenantId}/installedSkills/${installationId ?? 'n/a'}`,
            before,
            after,
            riskLevel,
            timestamp: new Date().toISOString(),
        };
        await this.db.collection(SKILL_AUDIT_COL(tenantId)).doc(auditId).set(record);
        return record;
    }
    async getInstalledPluginIds() {
        return this.pluginRuntime.listPlugins().map((p) => p.pluginId);
    }
    /** Best-effort structured hook — records which capabilities a manifest declares. No dynamic code execution. */
    registerDeclaredCapabilities(capabilities, installationId) {
        if (capabilities.length === 0)
            return;
        this.logger.info('SkillInstaller', `Installation "${installationId}" declares capabilities: ${capabilities.join(', ')}`);
    }
}
exports.SkillInstaller = SkillInstaller;
//# sourceMappingURL=SkillInstaller.js.map