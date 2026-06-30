import type * as admin from 'firebase-admin'
import { ApprovalEngine } from './ApprovalEngine'
import { DEFAULT_APPROVAL_CONFIG } from './ApprovalConfig'

// ── Per-user singleton sessions ───────────────────────────────────────────────

interface Session {
  engine: ApprovalEngine
  createdAt: number
}

const sessions = new Map<string, Session>()
const SESSION_TTL_MS = 20 * 60 * 1000

function getSession(userId: string, db: admin.firestore.Firestore, apiKey: string): Session {
  const existing = sessions.get(userId)
  if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS) return existing
  const session: Session = {
    engine: new ApprovalEngine(db, DEFAULT_APPROVAL_CONFIG, apiKey),
    createdAt: Date.now(),
  }
  sessions.set(userId, session)
  return session
}

export function getApprovalEngine(userId: string, db: admin.firestore.Firestore, apiKey: string): ApprovalEngine {
  return getSession(userId, db, apiKey).engine
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export { ApprovalEngine } from './ApprovalEngine'
export { ApprovalQueue } from './ApprovalQueue'
export { ApprovalHistory } from './ApprovalHistory'
export { ApprovalPolicy } from './ApprovalPolicy'
export { ApprovalTemplates, getTemplate, listTemplates, registerTemplate } from './ApprovalTemplates'
export { ApprovalNotifications } from './ApprovalNotifications'
export { ApprovalAnalytics } from './ApprovalAnalytics'
export { ApprovalMetrics } from './ApprovalMetrics'
export { ApprovalScheduler } from './ApprovalScheduler'
export { ApprovalRegistry, registerExecutor, getExecutor, listExecutors, unregisterExecutor } from './ApprovalRegistry'
export type { ApprovalExecutor } from './ApprovalRegistry'
export { ApprovalPermissions } from './ApprovalPermissions'
export { ApprovalLogger } from './ApprovalLogger'
export { ApprovalValidator } from './ApprovalValidator'
export { ApprovalEvents } from './ApprovalEvents'
export { ApprovalWorkflow } from './ApprovalWorkflow'
export { buildApprovalRequest, computeRiskScore, riskScoreToLevel, ApprovalRequestBuilder } from './ApprovalRequest'
export { DEFAULT_APPROVAL_CONFIG } from './ApprovalConfig'
export type { ApprovalConfig } from './ApprovalConfig'
export * from './ApprovalTypes'
