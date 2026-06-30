import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { TenantEngine } from '../security/TenantEngine'
import type { RBACEngine } from '../security/RBACEngine'
import type { ApprovalEngine } from '../delegation/ApprovalEngine'
import type { PluginRuntime } from '../plugins/PluginRuntime'
import type { ARIAPlugin } from '../plugins/Plugin'
import type { SkillInstallationRecord, SkillAuditRecord, SecurityLevel } from './MarketplaceTypes'
import { MarketplaceRegistry } from './MarketplaceRegistry'
import { SkillValidator } from './SkillValidator'
import { SkillCompatibility } from './SkillCompatibility'
import { SkillDependencyResolver } from './SkillDependencyResolver'
import { SkillSecurityScanner } from './SkillSecurityScanner'
import { SkillPermissions } from './SkillPermissions'
import { SkillBilling } from './SkillBilling'
import { SkillAnalytics } from './SkillAnalytics'
import { SkillEvents } from './SkillEvents'
import { MarketplaceLogger } from './MarketplaceLogger'
import { DEFAULT_MARKETPLACE_CONFIG, type MarketplaceConfig } from './MarketplaceConfig'

const INSTALLED_SKILLS_COL = (tenantId: string) => `tenants/${tenantId}/installedSkills`
const SKILL_AUDIT_COL = (tenantId: string) => `tenants/${tenantId}/skillAudit`

export interface InstallSkillInput {
  tenantId: string
  organizationId?: string | null
  itemId: string
  installedPluginFactory?: () => ARIAPlugin | null
}

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
export class SkillInstaller {
  private readonly compatibility: SkillCompatibility
  private readonly dependencies = new SkillDependencyResolver()
  private readonly scanner = new SkillSecurityScanner()
  private readonly permissions: SkillPermissions
  private readonly billing = new SkillBilling()
  private readonly analytics: SkillAnalytics
  private readonly events = new SkillEvents()
  private readonly logger = new MarketplaceLogger()

  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly registry: MarketplaceRegistry,
    private readonly tenants: TenantEngine,
    private readonly rbac: RBACEngine,
    private readonly approvalEngine: ApprovalEngine,
    private readonly pluginRuntime: PluginRuntime,
    private readonly config: MarketplaceConfig = DEFAULT_MARKETPLACE_CONFIG
  ) {
    this.compatibility = new SkillCompatibility(db, tenants)
    this.permissions = new SkillPermissions(db, rbac)
    this.analytics = new SkillAnalytics(db, registry)
    void this.rbac
  }

  // ── Install — the 11-step pipeline ─────────────────────────────────────

  async install(actorUserId: string, input: InstallSkillInput): Promise<SkillInstallationRecord> {
    const { tenantId, itemId } = input
    const organizationId = input.organizationId ?? null

    // Tenant membership gate — verified BEFORE any tenant-scoped read/write,
    // mirroring TenantEngine's hard invariant. No cross-tenant access.
    await this.tenants.requireIdentity(tenantId, actorUserId)
    await this.permissions.requireCanInstall(tenantId, actorUserId)

    const item = await this.registry.getItem(itemId)
    if (!item) throw new Error(`Marketplace item "${itemId}" not found`)
    if (item.status !== 'published') {
      throw new Error(`Marketplace item "${itemId}" is not published (status: "${item.status}")`)
    }
    const manifest = item.manifest

    // ── Step 1: Validate manifest ────────────────────────────────────────
    SkillValidator.validateManifest(manifest)

    const installedPlugins = await this.getInstalledPluginIds()

    // ── Step 2: Check tenant/org compatibility ───────────────────────────
    const compat = await this.compatibility.checkCompatibility(tenantId, actorUserId, manifest, installedPlugins)
    if (!compat.compatible) {
      throw new Error(`Skill "${itemId}" is not compatible with tenant "${tenantId}": ${compat.reasons.join('; ')}`)
    }

    const billing = this.billing.checkEligibility(manifest)
    if (!billing.eligible) {
      throw new Error(`Skill "${itemId}" cannot be installed: ${billing.reason}`)
    }

    // ── Step 3: Check required permissions via the real RBAC/Policy layer ─
    // (requireCanInstall already verified above; per-scope grants are
    // recorded in step 7 after a successful/approved install.)

    // ── Step 4: Check dependencies ────────────────────────────────────────
    const depResult = this.dependencies.resolve(manifest, installedPlugins)
    if (!depResult.resolved) {
      throw new Error(
        `Skill "${itemId}" has unresolved dependencies: missing plugins [${depResult.missingPlugins.join(', ')}], missing engines [${depResult.missingEngines.join(', ')}]`
      )
    }

    // ── Step 5: Run security scan (existing structured placeholder) ───────
    const missingDepCount = depResult.missingPlugins.length + depResult.missingEngines.length
    const scan = this.scanner.scan(manifest, missingDepCount)
    if (scan.score >= this.config.blockedScoreThreshold) {
      throw new Error(`Skill "${itemId}" blocked: security scan score ${scan.score} >= block threshold ${this.config.blockedScoreThreshold}. Reasons: ${scan.reasons.join('; ')}`)
    }

    const installationId = uuidv4()
    const now = new Date().toISOString()
    const needsApproval = scan.score >= this.config.approvalRequiredScoreThreshold || SkillPermissions.hasHighRiskScope(manifest.permissions)

    let approvalRequestId: string | null = null
    let status: SkillInstallationRecord['status'] = 'installed'

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
      })

      approvalRequestId = approval.id
      // The install must NOT proceed past this step until approved — if the
      // request is not in 'approved' status (i.e. it is genuinely pending),
      // persist a pending installation record and return early.
      if (approval.status !== 'approved') {
        status = 'submitted'
        const pendingRecord = await this.writeInstallationRecord(tenantId, organizationId, installationId, itemId, manifest.version, status, null, approvalRequestId, scan.score, scan.riskLevel, [], actorUserId, now)
        await this.writeAuditEvent(tenantId, organizationId, actorUserId, itemId, installationId, 'skill.install_pending_approval', scan.riskLevel, null, pendingRecord as unknown as Record<string, unknown>)
        this.events.emit('skill:install_pending_approval', actorUserId, itemId, installationId, { approvalRequestId })
        return pendingRecord
      }
    }

    // ── Step 7: Install skill — write installation record ────────────────
    let installedPluginId: string | null = null

    // ── Step 8: Register with Plugin Framework (real PluginRuntime.loadPlugin)
    const factory = input.installedPluginFactory
    if (factory) {
      const plugin = factory()
      if (plugin) {
        await this.pluginRuntime.loadPlugin(plugin, actorUserId)
        installedPluginId = plugin.manifest.id
      }
    }

    const record = await this.writeInstallationRecord(
      tenantId, organizationId, installationId, itemId, manifest.version, 'installed',
      installedPluginId, approvalRequestId, scan.score, scan.riskLevel, manifest.permissions, actorUserId, now
    )

    // ── Step 9: Register actions/tools/workflows/agents declared by the ───
    // manifest. Best-effort hook into the action-engine registry — the
    // registry self-registers actions at module load time, so this step
    // simply records which capabilities/tools the manifest declared rather
    // than dynamically constructing new BaseAction instances (out of scope
    // for declarative-manifest-only skills today).
    this.registerDeclaredCapabilities(manifest.capabilities, installationId)

    // ── Step 10: Write audit event (SkillAuditRecord shape, append-only) ──
    await this.writeAuditEvent(tenantId, organizationId, actorUserId, itemId, installationId, 'skill.installed', scan.riskLevel, null, record as unknown as Record<string, unknown>)

    // ── Step 11: Update marketplace analytics ─────────────────────────────
    await this.registry.incrementInstallCount(itemId, 1)
    await this.analytics.recordUsage(tenantId, actorUserId, { installationId, itemId, eventType: 'enabled', detail: 'installed' })

    this.events.emit('skill:installed', actorUserId, itemId, installationId, { tenantId })
    return record
  }

  async uninstall(actorUserId: string, tenantId: string, installationId: string): Promise<SkillInstallationRecord | null> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const ref = this.db.collection(INSTALLED_SKILLS_COL(tenantId)).doc(installationId)
    const snap = await ref.get()
    if (!snap.exists) return null
    const current = snap.data() as SkillInstallationRecord

    if (current.installedPluginId) {
      await this.pluginRuntime.unloadPlugin(current.installedPluginId)
    }

    await ref.update({ status: 'removed', updatedAt: new Date().toISOString() })
    const updated = (await ref.get()).data() as SkillInstallationRecord

    await this.registry.incrementInstallCount(current.itemId, -1)
    await this.writeAuditEvent(tenantId, current.organizationId, actorUserId, current.itemId, installationId, 'skill.uninstalled', current.securityScanRiskLevel, current as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>)
    this.events.emit('skill:uninstalled', actorUserId, current.itemId, installationId, { tenantId })
    return updated
  }

  async enable(actorUserId: string, tenantId: string, installationId: string): Promise<SkillInstallationRecord | null> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const updated = await this.setStatus(tenantId, installationId, 'enabled')
    if (updated) {
      await this.analytics.recordUsage(tenantId, actorUserId, { installationId, itemId: updated.itemId, eventType: 'enabled', detail: null })
      await this.writeAuditEvent(tenantId, updated.organizationId, actorUserId, updated.itemId, installationId, 'skill.enabled', updated.securityScanRiskLevel, null, updated as unknown as Record<string, unknown>)
      this.events.emit('skill:enabled', actorUserId, updated.itemId, installationId, { tenantId })
    }
    return updated
  }

  async disable(actorUserId: string, tenantId: string, installationId: string): Promise<SkillInstallationRecord | null> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const updated = await this.setStatus(tenantId, installationId, 'disabled')
    if (updated) {
      await this.analytics.recordUsage(tenantId, actorUserId, { installationId, itemId: updated.itemId, eventType: 'disabled', detail: null })
      await this.writeAuditEvent(tenantId, updated.organizationId, actorUserId, updated.itemId, installationId, 'skill.disabled', updated.securityScanRiskLevel, null, updated as unknown as Record<string, unknown>)
      this.events.emit('skill:disabled', actorUserId, updated.itemId, installationId, { tenantId })
    }
    return updated
  }

  async listInstalled(actorUserId: string, tenantId: string): Promise<SkillInstallationRecord[]> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const snap = await this.db.collection(INSTALLED_SKILLS_COL(tenantId)).get()
    return snap.docs.map((d) => d.data() as SkillInstallationRecord)
  }

  // ── Internal helpers — the only Firestore writes in this class ─────────

  private async setStatus(tenantId: string, installationId: string, status: SkillInstallationRecord['status']): Promise<SkillInstallationRecord | null> {
    const ref = this.db.collection(INSTALLED_SKILLS_COL(tenantId)).doc(installationId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ status, updatedAt: new Date().toISOString() })
    return (await ref.get()).data() as SkillInstallationRecord
  }

  private async writeInstallationRecord(
    tenantId: string, organizationId: string | null, installationId: string, itemId: string, manifestVersion: string,
    status: SkillInstallationRecord['status'], installedPluginId: string | null, approvalRequestId: string | null,
    securityScanScore: number, securityScanRiskLevel: SecurityLevel, grantedPermissions: SkillInstallationRecord['grantedPermissions'],
    actorUserId: string, now: string
  ): Promise<SkillInstallationRecord> {
    const record: SkillInstallationRecord = {
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
    }
    await this.db.collection(INSTALLED_SKILLS_COL(tenantId)).doc(installationId).set(record)
    if (grantedPermissions.length > 0) {
      await this.permissions.recordGrants(tenantId, actorUserId, installationId, itemId, grantedPermissions)
    }
    return record
  }

  private async writeAuditEvent(
    tenantId: string, organizationId: string | null, actorId: string, itemId: string | null, installationId: string | null,
    action: string, riskLevel: SecurityLevel, before: Record<string, unknown> | null, after: Record<string, unknown> | null
  ): Promise<SkillAuditRecord> {
    const auditId = uuidv4()
    const record: SkillAuditRecord = {
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
    }
    await this.db.collection(SKILL_AUDIT_COL(tenantId)).doc(auditId).set(record)
    return record
  }

  private async getInstalledPluginIds(): Promise<string[]> {
    return this.pluginRuntime.listPlugins().map((p) => p.pluginId)
  }

  /** Best-effort structured hook — records which capabilities a manifest declares. No dynamic code execution. */
  private registerDeclaredCapabilities(capabilities: string[], installationId: string): void {
    if (capabilities.length === 0) return
    this.logger.info('SkillInstaller', `Installation "${installationId}" declares capabilities: ${capabilities.join(', ')}`)
  }
}
