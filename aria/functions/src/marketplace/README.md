# AI Marketplace & Skills Ecosystem — Phase 5.3

The Marketplace module lets publishers list **Skills** (declarative
capability manifests), lets tenant operators browse/install/enable/disable
them, and ties installation to the real RBAC, Tenant, Approval, and Plugin
infrastructure built in earlier phases. It is purely additive: it never
duplicates `RBACEngine`'s permission logic, `TenantEngine`'s membership
gate, `ApprovalEngine`'s approval workflow, or `PluginRuntime`'s plugin
loading — it composes/bridges to all four.

## Architecture

```
MarketplaceEngine (facade, per-user singleton via index.ts getMarketplaceEngine)
├── MarketplaceRegistry     Firestore CRUD for marketplace items, publishers, categories
├── SkillManager            Lifecycle state machine: draft → submitted → under_review
│                           → approved → published → deprecated/removed (+ installed/
│                           enabled/disabled sub-states tracked per installation)
├── SkillCatalog            Read-side browse/search/filter/paginate over published items
├── SkillInstaller          THE 11-STEP INSTALL PIPELINE — see below
├── SkillPermissions        Per-tenant permission-scope grants; requireCanInstall()
│                           delegates to the real RBACEngine.requirePermission()
├── SkillCompatibility      Tenant/org + dependency-shape compatibility checks;
│                           delegates to the real TenantEngine.requireIdentity()
├── SkillDependencyResolver Synchronous manifest dependency resolution (no DB)
├── SkillSecurityScanner    STRUCTURED PLACEHOLDER — see "Security scanner" below
├── SkillReviewManager      Review CRUD + rating recomputation
├── SkillVersionManager     Version publish/compatibility helpers
├── SkillBilling            STRUCTURED PLACEHOLDER — free tier always eligible,
│                           paid tiers always ineligible (no real payment processor)
├── SkillAnalytics          Usage event recording + per-item analytics snapshot
├── SkillEvents             Typed in-process event emitter/log for lifecycle events
├── SkillNotifications      STRUCTURED STUB — see "Notifications" below
└── MarketplaceLogger       Structured console logger, mirrors SecurityLogger.ts
```

`MarketplaceConfig.ts` holds `DEFAULT_MARKETPLACE_CONFIG`
(`approvalRequiredScoreThreshold: 35`, `blockedScoreThreshold: 85`,
`maxScreenshots: 8`, `maxCapabilities: 20`). `MarketplaceTypes.ts` holds the
full closed vocabulary: item status, permission scopes
(`SKILL_PERMISSION_SCOPES`), categories (`MARKETPLACE_CATEGORIES`), pricing
models, and the Firestore record shapes referenced throughout this doc.

## Manifest shape (`SkillManifest`)

A manifest is the declarative description a publisher submits — it is never
executable code uploaded to ARIA. Key fields: `id`, `name`, `slug`,
`version` (semver), `author`, `description`, `category`, `itemType`,
`permissions: SkillPermissionScope[]` (the scopes the skill requests, e.g.
`read.contacts`, `send.email`, `write.finance`), `capabilities: string[]`
(declared tools/actions/workflows/agents the skill registers — informational
only in this phase, see Step 9 below), `dependencies` (plugin ids / engine
versions), and `pricingModel`. `SkillValidator.validateManifest` is the only
place manifest shape is checked.

## The 11-step install pipeline (`SkillInstaller.install`)

Tenant membership (`TenantEngine.requireIdentity`) and install permission
(`SkillPermissions.requireCanInstall` → `RBACEngine.requirePermission`) are
verified **before** any of the 11 steps run. The steps, in order:

1. **Validate manifest** — `SkillValidator.validateManifest(manifest)`
2. **Check tenant/org compatibility** — `SkillCompatibility.checkCompatibility`
   (re-verifies tenant identity) + `SkillBilling.checkEligibility`
3. **Check required permissions via the real RBAC/Policy layer** —
   already enforced by `requireCanInstall` above; per-scope grants are
   recorded in step 7
4. **Check dependencies** — `SkillDependencyResolver.resolve` against
   currently-installed plugin ids (read from the real `PluginRuntime`)
5. **Run security scan (existing structured placeholder)** —
   `SkillSecurityScanner.scan`; installs with `score >= blockedScoreThreshold`
   are rejected outright
6. **If risk is medium/high, request approval via the real
   `ApprovalEngine.createApprovalRequest`** — triggered when
   `score >= approvalRequiredScoreThreshold` or the manifest requests a
   high-risk scope (`SkillPermissions.hasHighRiskScope`). If the resulting
   request is not immediately `'approved'`, a `status: 'submitted'`
   installation record is written and the method **returns early** — no
   plugin registration, capability registration, "installed" audit event,
   or analytics increment happens until a real approval exists
7. **Install skill — write installation record** —
   `SkillInstaller.writeInstallationRecord` (the only place
   `tenants/{tenantId}/installedSkills/{installationId}` is written)
8. **Register with Plugin Framework** — real
   `PluginRuntime.loadPlugin(plugin, actorUserId)`, via an optional
   caller-supplied `installedPluginFactory()`
9. **Register declared capabilities** — best-effort, log-only hook
   (`registerDeclaredCapabilities`); records which tools/actions/workflows
   the manifest declares without dynamically constructing or executing any
   code, since marketplace skills are declarative manifests only in this
   phase
10. **Write audit event** — append-only `SkillAuditRecord` written to
    `tenants/{tenantId}/skillAudit`
11. **Update marketplace analytics** —
    `MarketplaceRegistry.incrementInstallCount` + `SkillAnalytics.recordUsage`

`uninstall`/`enable`/`disable` follow the same tenant-membership-first
pattern and use the same `writeAuditEvent` helper for their own audit trail.

## No-bypass / no-cross-tenant-access — verified by reading the code

**No bypass for risky installs**: the only path from "this install needs
approval" to an actual `ApprovalRequest` is
`this.approvalEngine.createApprovalRequest(...)`, where
`approvalEngine: ApprovalEngine` is injected into `SkillInstaller`'s
constructor from `../delegation` (never constructed internally) —
mirroring `PolicyEngine.requestApprovalForPolicy` /
`DelegationManager.requestApprovalForTask` exactly. `SkillInstaller` never
invents its own approval mechanism, never marks an install `'approved'`
itself, and never proceeds past step 6 while approval is genuinely pending.

**No cross-tenant access**: `install`, `uninstall`, `enable`, `disable`, and
`listInstalled` all call `this.tenants.requireIdentity(tenantId, actorUserId)`
as the first line of the method, before any tenant-scoped Firestore read or
write.

**No duplicated RBAC**: `SkillPermissions.requireCanInstall` is the only
place install-permission logic is interpreted, and it delegates to the real
`RBACEngine.requirePermission(tenantId, actorUserId, 'plugins.install')` —
`SkillInstaller` never reimplements a permission check inline.

**No raw Firestore writes outside Manager/Engine classes**: every
`db.collection(...).doc(...).set/update(...)` call in this module lives
inside `MarketplaceRegistry`, `SkillReviewManager`, `SkillPermissions`,
`SkillAnalytics`, or `SkillInstaller`'s own private helpers
(`writeInstallationRecord`, `setStatus`, `writeAuditEvent`). The Action
Engine actions and `marketplaceApi.ts` only ever call into
`MarketplaceEngine`; they hold no `Firestore` writes of their own.

## Permission model

`SkillPermissionScope` is a closed vocabulary (e.g. `read.contacts`,
`read.tasks`, `send.email`, `write.finance`, `read.health`,
`read.documents`). `SkillPermissions.hasHighRiskScope` flags scopes that
touch finance/health/external-send as high-risk, which forces the approval
gate in step 6 regardless of security-scan score. Granted scopes are
recorded per-installation in `tenants/{tenantId}/skillPermissions` and can
be revoked individually via `revokeSkillPermission` without uninstalling
the skill.

## Security scanner — explicitly NOT real malware/code scanning

`SkillSecurityScanner.scan` is a **structured placeholder**, exactly like
`security/README.md` documents `SessionRecord.ipAddress`/`location` as
placeholder fields. It scores 0–100 from declared manifest metadata only
(requested permission count/sensitivity, missing-dependency count, absence
of a verified publisher) — there is no static or dynamic code analysis, no
binary/package scanning, and no third-party security vendor integration.
Treat `SecurityScanResult.score`/`riskLevel`/`reasons` as a documentation
aid for the approval gate, not a real malware or vulnerability scan, until
a real scanning integration is built.

## Billing — explicitly NOT a real payment processor

`SkillBilling.checkEligibility` always returns eligible for
`pricingModel: 'free'` and always returns ineligible (with a reason string)
for any paid pricing model. There is no Stripe/payment-processor
integration, no entitlement storage, and no invoicing. Paid skills cannot
actually be purchased in this phase.

## Notifications — explicitly a stub, no real delivery

`SkillNotifications` constructs notification payloads
(`notifyInstallComplete`, `notifyApprovalNeeded`, `notifyReviewPublished`)
and logs them via `MarketplaceLogger`. There is no existing
`notifications/` delivery module in this codebase to call into, no email/
push/in-app delivery, and no persisted notification record. This class
exists so the call sites and payload shape are ready to wire into a real
delivery mechanism later.

## APIs

All Cloud Functions are `onCall` exports defined in
`aria/functions/src/marketplaceApi.ts` and re-exported from
`aria/functions/src/index.ts`:

`publishSkill`, `updateSkill`, `submitSkillForReview`, `approveSkill`,
`rejectSkill`, `installSkill`, `uninstallSkill`, `enableSkill`,
`disableSkill`, `listInstalledSkills`, `grantSkillPermission`,
`revokeSkillPermission`, `reviewSkill`, `listMarketplaceCatalog`,
`getSkillDetail`, `getSkillAnalytics`. Each follows the same
`requireAuth(request)` → `getMarketplaceEngine(uid, db(), apiKey())` →
`wrapEngineError(...)` pattern as `securityApi.ts`.

## Action Engine integration

12 self-registering actions live in `action-engine/actions/`:
`PublishSkillAction`, `UpdateSkillAction`, `SubmitSkillForReviewAction`,
`ApproveSkillAction`, `RejectSkillAction`, `InstallSkillAction`,
`UninstallSkillAction`, `EnableSkillAction`, `DisableSkillAction`,
`ReviewSkillAction`, `GrantSkillPermissionAction`,
`RevokeSkillPermissionAction`. Each is a thin wrapper that calls
`getMarketplaceEngine(ctx.userId, ctx.db, apiKey)` and delegates to the
matching `MarketplaceEngine` method — no business logic lives in the action
classes themselves.

## Firestore schema

```
marketplace/items/items/{itemId}                  Public-read, CF-write-only
marketplace/publishers/publishers/{publisherId}    Public-read, CF-write-only
marketplace/categories/categories/{categoryId}     Public-read, CF-write-only
marketplace/reviews/reviews/{reviewId}             Public-read, CF-write-only
tenants/{tenantId}/installedSkills/{installationId}  Deny-by-default client access
tenants/{tenantId}/skillPermissions/{permissionId}   Deny-by-default client access
tenants/{tenantId}/skillUsage/{usageId}              Deny-by-default client access
tenants/{tenantId}/skillAudit/{auditId}              Deny-by-default client access
```

All tenant-scoped collections are written exclusively through `onCall`
Cloud Functions using the Admin SDK (which bypasses rules); no client-side
real-time listeners are supported against these trees today, mirroring the
Phase 5.2 `tenants/{tenantId}/**` deny-by-default convention.

## Implemented today vs deferred

**Implemented today:**
- Skill lifecycle (draft → submitted → under_review → approved → published
  → deprecated/removed) with a closed state-transition table
- Catalog browse/search/filter/paginate over published items only
- The full 11-step install pipeline described above, including the real
  no-bypass approval gate and real Plugin Framework registration
- Per-tenant permission-scope grant/revoke, backed by real RBAC
- Reviews (submit/list/flag) with rating recomputation
- Usage analytics recording + per-item snapshot
- 16 onCall Cloud Functions + 12 self-registering Action Engine actions
- `/marketplace`, `/marketplace/:skillId`, and `/devtools/marketplace`
  frontend surfaces

**Deferred (explicitly NOT implemented — do not assume otherwise):**
- Real static/dynamic security scanning (`SkillSecurityScanner` is a
  declared-metadata-only placeholder, see above)
- Real payment processing for paid skills (`SkillBilling` always rejects
  non-free pricing models, see above)
- Real notification delivery (`SkillNotifications` logs only, see above)
- Dynamic execution of skill-declared capabilities — step 9 of the install
  pipeline only records which capabilities a manifest declares; it does not
  construct or execute new `BaseAction` instances at runtime
- Publisher verification/KYC workflows beyond the `publisherId` field
  existing in the type system

## Manual test instructions

1. `publishSkill` as a test publisher with a `free`, low-permission manifest
   → expect `status: 'draft'`
2. `submitSkillForReview` → `status: 'submitted'`
3. `approveSkill` (as a reviewer) → auto-transitions to `status: 'published'`
4. `installSkill` into a tenant the caller belongs to, with a low-risk
   manifest → expect immediate `status: 'installed'` and an
   `installSkill`-shaped `skillAudit` entry with `action: 'skill.installed'`
5. Repeat with a manifest requesting a high-risk scope (e.g.
   `write.finance`) → expect `status: 'submitted'` on the installation
   record and a real `ApprovalRequest` visible via the delegation/approval
   APIs; confirm no `skillAudit` entry with `action: 'skill.installed'`
   exists until the request is approved and `installSkill` is re-invoked
6. `installSkill` into a tenant the caller does **not** belong to → expect
   an `Access denied` error from `TenantEngine.requireIdentity`, not a
   marketplace-specific error
7. `enableSkill` / `disableSkill` / `uninstallSkill` → confirm status
   transitions and corresponding `skillAudit` entries
8. `grantSkillPermission` / `revokeSkillPermission` → confirm
   `tenants/{tenantId}/skillPermissions` records reflect the change
9. `reviewSkill` → confirm `marketplace/reviews/reviews` gains an entry and
   the item's aggregate rating updates
