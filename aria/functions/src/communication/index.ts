import type * as admin from 'firebase-admin'
import { CommunicationEngine } from './CommunicationEngine'
import { DEFAULT_COMMUNICATION_CONFIG } from './CommunicationConfig'

// ── Per-user singleton sessions ───────────────────────────────────────────────

interface Session {
  engine: CommunicationEngine
  createdAt: number
}

const sessions = new Map<string, Session>()
const SESSION_TTL_MS = 20 * 60 * 1000

function getSession(userId: string, db: admin.firestore.Firestore, apiKey: string): Session {
  const existing = sessions.get(userId)
  if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS) return existing
  const session: Session = {
    engine: new CommunicationEngine(db, DEFAULT_COMMUNICATION_CONFIG, apiKey),
    createdAt: Date.now(),
  }
  sessions.set(userId, session)
  return session
}

export function getCommunicationEngine(
  userId: string,
  db: admin.firestore.Firestore,
  apiKey: string
): CommunicationEngine {
  return getSession(userId, db, apiKey).engine
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export { CommunicationEngine } from './CommunicationEngine'
export { CommunicationRegistry, registerProvider, getProvider, getProviderByType, listProviders } from './CommunicationRegistry'
export { CommunicationProvider, BaseProvider, NoOpProvider } from './CommunicationProvider'
export { ConversationManager } from './ConversationManager'
export { ConversationThreadStore } from './ConversationThread'
export { ConversationMemory } from './ConversationMemory'
export { CommunicationRouter } from './CommunicationRouter'
export { CommunicationSearch } from './CommunicationSearch'
export { CommunicationAnalytics } from './CommunicationAnalytics'
export { CommunicationScheduler } from './CommunicationScheduler'
export { CommunicationTemplates } from './CommunicationTemplates'
export { CommunicationHistory } from './CommunicationHistory'
export { CommunicationPermissions } from './CommunicationPermissions'
export { CommunicationValidator } from './CommunicationValidator'
export { CommunicationEvents } from './CommunicationEvents'
export { DEFAULT_COMMUNICATION_CONFIG } from './CommunicationConfig'
export type { CommunicationConfig } from './CommunicationConfig'
export * from './CommunicationTypes'
