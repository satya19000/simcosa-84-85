import type * as admin from 'firebase-admin'
import { SecurityEngine } from './SecurityEngine'
import { DEFAULT_SECURITY_CONFIG } from './SecurityConfig'
import { getApprovalEngine } from '../delegation'

// ── Per-user singleton sessions ───────────────────────────────────────────────
// Keyed by the calling userId, mirroring organization/index.ts and
// delegation/index.ts exactly. The session key is purely about reusing warm
// engine instances across invocations from the same caller, NOT a tenant
// boundary — every data operation SecurityEngine performs still takes an
// explicit tenantId and verifies a tenant identity before any read/write.

interface Session {
  engine: SecurityEngine
  createdAt: number
}

const sessions = new Map<string, Session>()
const SESSION_TTL_MS = 20 * 60 * 1000

function getSession(userId: string, db: admin.firestore.Firestore, apiKey: string): Session {
  const existing = sessions.get(userId)
  if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS) return existing
  const approvalEngine = getApprovalEngine(userId, db, apiKey)
  const session: Session = {
    engine: new SecurityEngine(db, DEFAULT_SECURITY_CONFIG, apiKey, approvalEngine),
    createdAt: Date.now(),
  }
  sessions.set(userId, session)
  return session
}

export function getSecurityEngine(userId: string, db: admin.firestore.Firestore, apiKey: string): SecurityEngine {
  return getSession(userId, db, apiKey).engine
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export { SecurityEngine } from './SecurityEngine'
export { TenantEngine } from './TenantEngine'
export { IdentityEngine } from './IdentityEngine'
export { RBACEngine } from './RBACEngine'
export { RoleManager } from './RoleManager'
export { PermissionManager } from './PermissionManager'
export { PolicyEngine } from './PolicyEngine'
export { SessionManager } from './SessionManager'
export { UserDirectory } from './UserDirectory'
export { GroupManager } from './GroupManager'
export { SecurityAudit } from './SecurityAudit'
export { SecurityEventType } from './SecurityEvents'
export type { SecurityEventName } from './SecurityEvents'
export { SecurityAnalytics } from './SecurityAnalytics'
export type { SecurityAnalyticsSnapshot } from './SecurityAnalytics'
export { SecurityValidator, SecurityValidationError } from './SecurityValidator'
export { DEFAULT_SECURITY_CONFIG } from './SecurityConfig'
export type { SecurityConfig } from './SecurityConfig'
export { SecurityLogger } from './SecurityLogger'
export * from './SecurityTypes'
