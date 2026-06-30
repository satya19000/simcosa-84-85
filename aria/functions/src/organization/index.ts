import type * as admin from 'firebase-admin'
import { OrganizationEngine } from './OrganizationEngine'
import { DEFAULT_WORKSPACE_CONFIG } from './WorkspaceConfig'
import { getMissionEngine } from '../mission-control'
import { getApprovalEngine } from '../delegation'

// ── Per-user singleton sessions ───────────────────────────────────────────────
// Keyed by the calling userId, mirroring delegation/index.ts and
// mission-control/index.ts. Each request is per-authenticated-user; every
// data operation the resulting OrganizationEngine performs still takes an
// explicit organizationId and verifies membership before any read/write —
// the session key is purely about reusing warm engine instances across
// invocations from the same caller, NOT a tenant boundary by itself.

interface Session {
  engine: OrganizationEngine
  createdAt: number
}

const sessions = new Map<string, Session>()
const SESSION_TTL_MS = 20 * 60 * 1000

function getSession(userId: string, db: admin.firestore.Firestore, apiKey: string): Session {
  const existing = sessions.get(userId)
  if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS) return existing
  const missionEngine = getMissionEngine(userId, db, apiKey)
  const approvalEngine = getApprovalEngine(userId, db, apiKey)
  const session: Session = {
    engine: new OrganizationEngine(db, DEFAULT_WORKSPACE_CONFIG, apiKey, missionEngine, approvalEngine),
    createdAt: Date.now(),
  }
  sessions.set(userId, session)
  return session
}

export function getOrganizationEngine(userId: string, db: admin.firestore.Firestore, apiKey: string): OrganizationEngine {
  return getSession(userId, db, apiKey).engine
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export { OrganizationEngine } from './OrganizationEngine'
export { OrganizationManager } from './OrganizationManager'
export { WorkspaceManager } from './WorkspaceManager'
export { MemberManager } from './MemberManager'
export { InvitationManager } from './InvitationManager'
export { DelegationManager } from './DelegationManager'
export { ActivityFeed } from './ActivityFeed'
export { OrganizationAnalytics } from './OrganizationAnalytics'
export { WorkspacePermissions } from './WorkspacePermissions'
export { WorkspacePolicies } from './WorkspacePolicies'
export { WorkspaceEvents } from './WorkspaceEvents'
export { WorkspaceNotifications } from './WorkspaceNotifications'
export { WorkspaceValidator, WorkspaceValidationError } from './WorkspaceValidator'
export { DEFAULT_WORKSPACE_CONFIG } from './WorkspaceConfig'
export type { WorkspaceConfig } from './WorkspaceConfig'
export { WorkspaceLogger } from './WorkspaceLogger'
export * from './WorkspaceTypes'
