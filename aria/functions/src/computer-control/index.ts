import type * as admin from 'firebase-admin'
import { ComputerControlEngine } from './ComputerControlEngine'
import { DEFAULT_COMPUTER_CONTROL_CONFIG } from './ComputerConfig'
import { TenantEngine, RBACEngine, RoleManager, PermissionManager } from '../security'
import { getApprovalEngine } from '../delegation'

// ── Per-user singleton sessions ─────────────────────────────────────────────
// Mirrors ai-gateway/index.ts, marketplace/index.ts, security/index.ts patterns.

interface Session {
  engine: ComputerControlEngine
  createdAt: number
}

const sessions = new Map<string, Session>()
const SESSION_TTL_MS = 20 * 60 * 1000

function getSession(userId: string, db: admin.firestore.Firestore, apiKey: string): Session {
  const existing = sessions.get(userId)
  if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS) return existing

  const tenants = new TenantEngine(db)
  const roles = new RoleManager(db, tenants)
  const permissionManager = new PermissionManager(db, tenants, roles)
  const rbac = new RBACEngine(db, tenants, roles, permissionManager)
  const approvalEngine = getApprovalEngine(userId, db, apiKey)

  const session: Session = {
    engine: new ComputerControlEngine(db, DEFAULT_COMPUTER_CONTROL_CONFIG, tenants, rbac, approvalEngine),
    createdAt: Date.now(),
  }
  sessions.set(userId, session)
  return session
}

export function getComputerControlEngine(userId: string, db: admin.firestore.Firestore, apiKey: string): ComputerControlEngine {
  return getSession(userId, db, apiKey).engine
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export { ComputerControlEngine } from './ComputerControlEngine'
export { ComputerAgent } from './ComputerAgent'
export { BrowserAgent } from './BrowserAgent'
export { DesktopAgent } from './DesktopAgent'
export { LocalBridge } from './LocalBridge'
export { BrowserBridge } from './BrowserBridge'
export { ComputerCapabilityRegistry } from './ComputerCapabilityRegistry'
export { ComputerSafetyGuard, ComputerSafetyError } from './ComputerSafetyGuard'
export { ComputerPermissions } from './ComputerPermissions'
export { ComputerApprovalBridge } from './ComputerApprovalBridge'
export { ComputerPolicyEngine } from './ComputerPolicyEngine'
export { ComputerAudit } from './ComputerAudit'
export { ComputerLogger } from './ComputerLogger'
export { ComputerSessionManager } from './ComputerSessionManager'
export { ComputerActionPlanner } from './ComputerActionPlanner'
export { ComputerActionExecutor } from './ComputerActionExecutor'
export { ComputerEvents } from './ComputerEvents'
export { WebPWAProvider, BrowserExtensionProvider, DesktopAgentProvider, ElectronProvider, TauriProvider, NativeOSProvider } from './ComputerProvider'
export { DEFAULT_COMPUTER_CONTROL_CONFIG } from './ComputerConfig'
export type { ComputerControlConfig } from './ComputerConfig'
export * from './ComputerTypes'
