import type * as admin from 'firebase-admin'
import { MarketplaceEngine } from './MarketplaceEngine'
import { DEFAULT_MARKETPLACE_CONFIG } from './MarketplaceConfig'
import { getApprovalEngine } from '../delegation'
import { TenantEngine, RBACEngine, RoleManager, PermissionManager } from '../security'
import { getPluginRuntime } from '../plugins'

// ── Per-user singleton sessions ─────────────────────────────────────────
// Keyed by the calling userId, mirroring security/index.ts's
// getSecurityEngine TTL singleton pattern exactly. The session key is
// purely about reusing warm engine instances across invocations from the
// same caller, NOT a tenant boundary — every data operation MarketplaceEngine
// performs still takes an explicit tenantId and verifies a tenant identity
// before any tenant-scoped read/write.

interface Session {
  engine: MarketplaceEngine
  createdAt: number
}

const sessions = new Map<string, Session>()
const SESSION_TTL_MS = 20 * 60 * 1000

function getSession(userId: string, db: admin.firestore.Firestore, apiKey: string): Session {
  const existing = sessions.get(userId)
  if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS) return existing

  const approvalEngine = getApprovalEngine(userId, db, apiKey)
  const tenants = new TenantEngine(db)
  const roles = new RoleManager(db, tenants)
  const permissions = new PermissionManager(db, tenants, roles)
  const rbac = new RBACEngine(db, tenants, roles, permissions)
  const pluginRuntime = getPluginRuntime(db)

  const session: Session = {
    engine: new MarketplaceEngine(db, DEFAULT_MARKETPLACE_CONFIG, apiKey, tenants, rbac, approvalEngine, pluginRuntime),
    createdAt: Date.now(),
  }
  sessions.set(userId, session)
  return session
}

export function getMarketplaceEngine(userId: string, db: admin.firestore.Firestore, apiKey: string): MarketplaceEngine {
  return getSession(userId, db, apiKey).engine
}

// ── Re-exports ────────────────────────────────────────────────────────────

export { MarketplaceEngine } from './MarketplaceEngine'
export { MarketplaceRegistry } from './MarketplaceRegistry'
export { SkillManager } from './SkillManager'
export { SkillInstaller } from './SkillInstaller'
export type { InstallSkillInput } from './SkillInstaller'
export { SkillCatalog } from './SkillCatalog'
export type { CatalogFilters, CatalogPage } from './SkillCatalog'
export { SkillEvents } from './SkillEvents'
export type { SkillEvent, SkillEventName } from './SkillEvents'
export { SkillNotifications } from './SkillNotifications'
export { SkillValidator, SkillValidationError } from './SkillValidator'
export { SkillCompatibility } from './SkillCompatibility'
export { SkillDependencyResolver } from './SkillDependencyResolver'
export { SkillSecurityScanner } from './SkillSecurityScanner'
export { SkillPermissions } from './SkillPermissions'
export { SkillReviewManager } from './SkillReviewManager'
export { SkillVersionManager } from './SkillVersionManager'
export { SkillBilling } from './SkillBilling'
export type { BillingEligibility } from './SkillBilling'
export { SkillAnalytics } from './SkillAnalytics'
export { MarketplaceLogger } from './MarketplaceLogger'
export { DEFAULT_MARKETPLACE_CONFIG } from './MarketplaceConfig'
export type { MarketplaceConfig } from './MarketplaceConfig'
export * from './MarketplaceTypes'
