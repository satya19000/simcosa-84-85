import type * as admin from 'firebase-admin'
import { HealthEngine } from './HealthEngine'
import { DEFAULT_HEALTH_CONFIG } from './HealthConfig'

// ── Per-user singleton sessions ───────────────────────────────────────────────

interface Session {
  engine: HealthEngine
  createdAt: number
}

const sessions = new Map<string, Session>()
const SESSION_TTL_MS = 20 * 60 * 1000

function getSession(userId: string, db: admin.firestore.Firestore, apiKey: string): Session {
  const existing = sessions.get(userId)
  if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS) return existing
  const session: Session = {
    engine: new HealthEngine(db, DEFAULT_HEALTH_CONFIG, apiKey),
    createdAt: Date.now(),
  }
  sessions.set(userId, session)
  return session
}

export function getHealthEngine(userId: string, db: admin.firestore.Firestore, apiKey: string): HealthEngine {
  return getSession(userId, db, apiKey).engine
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export { HealthEngine } from './HealthEngine'
export { HealthRegistry, registerProvider, getProvider, getProviderByType, listProviders } from './HealthRegistry'
export { HealthProvider, BaseHealthProvider, NoOpHealthProvider } from './HealthProvider'
export { PatientManager } from './PatientManager'
export { FacilityManager } from './FacilityManager'
export { AppointmentManager } from './AppointmentManager'
export { MedicationManager } from './MedicationManager'
export { VaccinationManager } from './VaccinationManager'
export { DiseaseKnowledge } from './DiseaseKnowledge'
export { ClinicalDecisionSupport } from './ClinicalDecisionSupport'
export { HealthAnalytics } from './HealthAnalytics'
export { HealthScheduler } from './HealthScheduler'
export { HealthPermissions } from './HealthPermissions'
export { HealthValidator } from './HealthValidator'
export { HealthEvents } from './HealthEvents'
export { DEFAULT_HEALTH_CONFIG } from './HealthConfig'
export type { HealthConfig } from './HealthConfig'
export { HealthPluginRegistry, healthPluginRegistry } from './HealthProgramPlugin'
export type { HealthProgramPlugin, HealthProgramReport, HealthProgramDashboardWidget } from './HealthProgramPlugin'
export * from './HealthTypes'
