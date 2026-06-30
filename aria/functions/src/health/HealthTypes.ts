// ── Core Enumerations ───────────────────────────────────────────────────────

export type FacilityType =
  | 'hospital' | 'clinic' | 'phc' | 'uphc' | 'district_hospital'
  | 'laboratory' | 'pharmacy' | 'custom'

export type ProviderRole = 'doctor' | 'nurse' | 'health_worker' | 'admin' | 'custom'

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'missed' | 'rescheduled'

export type AppointmentType = 'in_person' | 'telemedicine' | 'home_visit' | 'follow_up'

export type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'monthly'

export type MedicationStatus = 'active' | 'completed' | 'discontinued' | 'paused'

export type DoseStatus = 'taken' | 'missed' | 'skipped' | 'pending'

export type VaccinationStatus = 'due' | 'upcoming' | 'completed' | 'missed' | 'booster_due'

export type HealthProviderStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'syncing'

export type HealthEventName =
  | 'patient:created' | 'patient:updated'
  | 'appointment:scheduled' | 'appointment:rescheduled' | 'appointment:cancelled' | 'appointment:completed'
  | 'medication:added' | 'medication:dose_missed' | 'medication:refill_due'
  | 'vaccination:scheduled' | 'vaccination:completed' | 'vaccination:missed'
  | 'report:ingested' | 'decision_support:generated' | 'reminder:suggested'

export type HealthRole = 'reader' | 'health_worker' | 'doctor' | 'admin'

export interface HealthPermissionRecord {
  userId: string
  patientId: string
  role: HealthRole
  grantedAt: string
}

export interface HealthEvent<T = unknown> {
  name: HealthEventName
  userId: string
  payload: T
  emittedAt: string
}

// ── Provider Health/Search ───────────────────────────────────────────────────

export interface HealthProviderHealth {
  providerId: string
  status: HealthProviderStatus
  lastCheckedAt: string
  latencyMs?: number
  error?: string
}

export interface HealthProviderSearchResult {
  items: Array<{ id: string; type: string; title: string; snippet: string }>
  total: number
}

// ── Patient ──────────────────────────────────────────────────────────────────

export interface PatientDemographics {
  fullName: string
  dateOfBirth?: string
  sex?: 'male' | 'female' | 'other' | 'unknown'
  phone?: string
  email?: string
  address?: string
  contactId?: string
}

export interface PatientVisit {
  id: string
  facilityId?: string
  providerId?: string
  date: string
  reason: string
  notes?: string
  vitals?: Record<string, string | number>
}

export interface PatientAllergy {
  id: string
  substance: string
  reaction?: string
  severity?: 'mild' | 'moderate' | 'severe'
}

export interface PatientMedicalHistoryEntry {
  id: string
  condition: string
  diagnosedAt?: string
  notes?: string
}

export interface LabResult {
  id: string
  testName: string
  value: string
  unit?: string
  referenceRange?: string
  date: string
  documentId?: string
}

export interface Patient {
  id: string
  userId: string
  demographics: PatientDemographics
  visits: PatientVisit[]
  allergies: PatientAllergy[]
  medicalHistory: PatientMedicalHistoryEntry[]
  labResults: LabResult[]
  documentIds: string[]
  memoryNodeId?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

// ── Facility & Provider (human) ──────────────────────────────────────────────

export interface HealthFacility {
  id: string
  userId: string
  name: string
  type: FacilityType
  address?: string
  lat?: number
  lng?: number
  phone?: string
  services?: string[]
  memoryNodeId?: string
  createdAt: string
  updatedAt: string
}

export interface HealthcareProvider {
  id: string
  userId: string
  name: string
  role: ProviderRole
  facilityId?: string
  specialty?: string
  phone?: string
  email?: string
  createdAt: string
  updatedAt: string
}

// ── Appointment ──────────────────────────────────────────────────────────────

export interface Appointment {
  id: string
  userId: string
  patientId: string
  facilityId?: string
  providerId?: string
  type: AppointmentType
  status: AppointmentStatus
  scheduledFor: string
  durationMinutes: number
  reason?: string
  recurrence: RecurrenceRule
  travelTimeMinutes?: number
  reminderScheduled?: boolean
  createdAt: string
  updatedAt: string
}

// ── Medication ───────────────────────────────────────────────────────────────

export interface MedicationDose {
  id: string
  scheduledFor: string
  status: DoseStatus
  takenAt?: string
}

export interface Medication {
  id: string
  userId: string
  patientId: string
  name: string
  dosage: string
  frequency: string
  status: MedicationStatus
  startDate: string
  endDate?: string
  prescribedBy?: string
  refillDate?: string
  doses: MedicationDose[]
  createdAt: string
  updatedAt: string
}

// ── Vaccination ──────────────────────────────────────────────────────────────

export interface Vaccination {
  id: string
  userId: string
  patientId: string
  vaccineName: string
  doseNumber: number
  status: VaccinationStatus
  scheduledFor: string
  administeredAt?: string
  facilityId?: string
  isBooster: boolean
  createdAt: string
  updatedAt: string
}

// ── Disease Knowledge ────────────────────────────────────────────────────────

export interface DiseaseInfo {
  id: string
  name: string
  symptoms: string[]
  riskFactors: string[]
  guidelines: string[]
  protocols: string[]
  referenceLinks: string[]
  decisionSupportNotes: string[]
  programId?: string
  createdAt: string
  updatedAt: string
}

// ── Clinical Decision Support ────────────────────────────────────────────────

export interface DecisionSupportRule {
  id: string
  name: string
  diseaseId?: string
  condition: (context: DecisionSupportContext) => boolean
  recommendation: string
  severity: 'info' | 'warning' | 'alert'
}

export interface DecisionSupportContext {
  patient: Patient
  recentVisits?: PatientVisit[]
  medications?: Medication[]
  vitals?: Record<string, string | number>
}

export interface DecisionSupportResult {
  patientId: string
  recommendations: Array<{ rule: string; text: string; severity: 'info' | 'warning' | 'alert' }>
  checklists: string[]
  missingInformation: string[]
  generatedAt: string
  disclaimer: string
}

// ── Programs / Plugins ───────────────────────────────────────────────────────

export interface HealthProgram {
  id: string
  name: string
  description: string
  diseaseIds: string[]
  pluginId: string
}

// ── Analytics ────────────────────────────────────────────────────────────────

export interface HealthStats {
  totalPatients: number
  totalAppointments: number
  upcomingAppointments: number
  medicationAdherenceRate: number
  vaccinationCoverage: number
  pendingFollowUps: number
  facilitiesCount: number
  byFacilityType: Record<string, number>
}

// ── Suggestions (never auto-executed) ───────────────────────────────────────

export type HealthSuggestionType =
  | 'appointment_reminder' | 'medication_reminder' | 'follow_up_reminder'
  | 'health_education_message' | 'refill_reminder' | 'vaccination_due'

export interface HealthSuggestion {
  id: string
  patientId: string
  type: HealthSuggestionType
  title: string
  description: string
  requiresApproval: true
  createdAt: string
}
