import type * as admin from 'firebase-admin'
import { MissionEngine } from './MissionEngine'
import { DEFAULT_MISSION_CONFIG } from './MissionConfig'
import { getApprovalEngine } from '../delegation'

// ── Per-user singleton sessions ───────────────────────────────────────────────

interface Session {
  engine: MissionEngine
  createdAt: number
}

const sessions = new Map<string, Session>()
const SESSION_TTL_MS = 20 * 60 * 1000

function getSession(userId: string, db: admin.firestore.Firestore, apiKey: string): Session {
  const existing = sessions.get(userId)
  if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS) return existing
  const approvalEngine = getApprovalEngine(userId, db, apiKey)
  const session: Session = {
    engine: new MissionEngine(db, DEFAULT_MISSION_CONFIG, apiKey, approvalEngine),
    createdAt: Date.now(),
  }
  sessions.set(userId, session)
  return session
}

export function getMissionEngine(userId: string, db: admin.firestore.Firestore, apiKey: string): MissionEngine {
  return getSession(userId, db, apiKey).engine
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export { MissionEngine } from './MissionEngine'
export { MissionManager } from './MissionManager'
export { MissionTaskManager } from './MissionTaskManager'
export { MissionPlanner } from './MissionPlanner'
export type { PlanTaskInput } from './MissionPlanner'
export { MissionAnalytics } from './MissionAnalytics'
export { RecommendationManager } from './RecommendationManager'
export { RecommendationEngine } from './RecommendationEngine'
export { LearningEngine } from './LearningEngine'
export { PredictionManager } from './PredictionManager'
export { PredictionEngine } from './PredictionEngine'
export { ContinuousPlanningEngine } from './ContinuousPlanningEngine'
export type { PlanningRunSummary } from './ContinuousPlanningEngine'
export { MissionScheduler } from './MissionScheduler'
export { MissionApprovalBridge } from './MissionApprovalBridge'
export { MissionPermissions } from './MissionPermissions'
export { MissionHistory } from './MissionHistory'
export { MissionLogger } from './MissionLogger'
export { MissionValidator, MissionValidationError } from './MissionValidator'
export { MissionEvents } from './MissionEvents'
export { DEFAULT_MISSION_CONFIG } from './MissionConfig'
export type { MissionConfig } from './MissionConfig'
export * from './MissionTypes'
