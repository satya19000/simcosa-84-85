import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { getHealthEngine } from './health'
import type {
  PatientDemographics, PatientVisit, PatientAllergy, PatientMedicalHistoryEntry, LabResult,
  HealthFacility, HealthcareProvider, FacilityType, ProviderRole,
  Appointment, AppointmentStatus, RecurrenceRule,
  Medication, MedicationStatus, DoseStatus,
  Vaccination, VaccinationStatus,
  DiseaseInfo, HealthProgram,
} from './health/HealthTypes'

function db(): admin.firestore.Firestore {
  return admin.firestore()
}

function apiKey(): string {
  return process.env.ANTHROPIC_API_KEY ?? ''
}

// ── Providers ─────────────────────────────────────────────────────────────────

export const getHealthProviderHealth = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.healthCheckAll(request.auth.uid)
  }
)

export const listHealthProviders = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.listProviders()
  }
)

// ── Patients ──────────────────────────────────────────────────────────────────

export const createPatient = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { demographics, tags } = request.data as { demographics: PatientDemographics; tags?: string[] }
    if (!demographics?.fullName) throw new HttpsError('invalid-argument', 'demographics.fullName required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.createPatient(request.auth.uid, demographics, tags)
  }
)

export const getPatient = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { patientId } = request.data as { patientId: string }
    if (!patientId) throw new HttpsError('invalid-argument', 'patientId required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.getPatient(request.auth.uid, patientId)
  }
)

export const listPatients = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { limit } = (request.data ?? {}) as { limit?: number }
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.listPatients(request.auth.uid, limit)
  }
)

export const addPatientVisit = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { patientId, visit } = request.data as { patientId: string; visit: Omit<PatientVisit, 'id'> }
    if (!patientId || !visit) throw new HttpsError('invalid-argument', 'patientId and visit required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.addVisit(request.auth.uid, patientId, visit)
  }
)

export const addPatientAllergy = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { patientId, allergy } = request.data as { patientId: string; allergy: Omit<PatientAllergy, 'id'> }
    if (!patientId || !allergy) throw new HttpsError('invalid-argument', 'patientId and allergy required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.addAllergy(request.auth.uid, patientId, allergy)
  }
)

export const addPatientMedicalHistory = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { patientId, entry } = request.data as { patientId: string; entry: Omit<PatientMedicalHistoryEntry, 'id'> }
    if (!patientId || !entry) throw new HttpsError('invalid-argument', 'patientId and entry required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.addMedicalHistory(request.auth.uid, patientId, entry)
  }
)

export const addPatientLabResult = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { patientId, result } = request.data as { patientId: string; result: Omit<LabResult, 'id'> }
    if (!patientId || !result) throw new HttpsError('invalid-argument', 'patientId and result required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.addLabResult(request.auth.uid, patientId, result)
  }
)

// ── Facilities & Providers ───────────────────────────────────────────────────

export const createHealthFacility = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const fields = request.data as Omit<HealthFacility, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    if (!fields?.name || !fields?.type) throw new HttpsError('invalid-argument', 'name and type required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.createFacility(request.auth.uid, fields)
  }
)

export const listHealthFacilities = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { type } = (request.data ?? {}) as { type?: FacilityType }
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.listFacilities(request.auth.uid, type)
  }
)

export const createHealthcareProvider = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const fields = request.data as Omit<HealthcareProvider, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    if (!fields?.name || !fields?.role) throw new HttpsError('invalid-argument', 'name and role required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.createHealthcareProvider(request.auth.uid, fields)
  }
)

export const listHealthcareProviders = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { role } = (request.data ?? {}) as { role?: ProviderRole }
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.listHealthcareProviders(request.auth.uid, role)
  }
)

// ── Appointments ──────────────────────────────────────────────────────────────

export const scheduleAppointment = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const fields = request.data as Omit<Appointment, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>
    if (!fields?.patientId || !fields?.scheduledFor) throw new HttpsError('invalid-argument', 'patientId and scheduledFor required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.scheduleAppointment(request.auth.uid, fields)
  }
)

export const rescheduleAppointment = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { appointmentId, newTime } = request.data as { appointmentId: string; newTime: string }
    if (!appointmentId || !newTime) throw new HttpsError('invalid-argument', 'appointmentId and newTime required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    await engine.rescheduleAppointment(request.auth.uid, appointmentId, newTime)
    return { success: true }
  }
)

export const cancelAppointment = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { appointmentId } = request.data as { appointmentId: string }
    if (!appointmentId) throw new HttpsError('invalid-argument', 'appointmentId required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    await engine.cancelAppointment(request.auth.uid, appointmentId)
    return { success: true }
  }
)

export const completeAppointment = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { appointmentId } = request.data as { appointmentId: string }
    if (!appointmentId) throw new HttpsError('invalid-argument', 'appointmentId required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    await engine.completeAppointment(request.auth.uid, appointmentId)
    return { success: true }
  }
)

export const setAppointmentTravelTime = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { appointmentId, minutes } = request.data as { appointmentId: string; minutes: number }
    if (!appointmentId || minutes === undefined) throw new HttpsError('invalid-argument', 'appointmentId and minutes required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    await engine.setAppointmentTravelTime(request.auth.uid, appointmentId, minutes)
    return { success: true }
  }
)

export const listAppointments = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const opts = (request.data ?? {}) as { patientId?: string; status?: AppointmentStatus; limit?: number }
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.listAppointments(request.auth.uid, opts)
  }
)

export const createRecurringAppointments = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { base, rule, occurrences } = request.data as {
      base: Omit<Appointment, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>
      rule: RecurrenceRule
      occurrences: number
    }
    if (!base?.patientId || !rule || !occurrences) throw new HttpsError('invalid-argument', 'base, rule, occurrences required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.createRecurringAppointments(request.auth.uid, base, rule, occurrences)
  }
)

// ── Medications ───────────────────────────────────────────────────────────────

export const addMedication = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const fields = request.data as Omit<Medication, 'id' | 'userId' | 'status' | 'doses' | 'createdAt' | 'updatedAt'>
    if (!fields?.patientId || !fields?.name) throw new HttpsError('invalid-argument', 'patientId and name required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.addMedication(request.auth.uid, fields)
  }
)

export const updateMedicationStatus = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { medicationId, status } = request.data as { medicationId: string; status: MedicationStatus }
    if (!medicationId || !status) throw new HttpsError('invalid-argument', 'medicationId and status required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    await engine.updateMedicationStatus(request.auth.uid, medicationId, status)
    return { success: true }
  }
)

export const listMedications = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const opts = (request.data ?? {}) as { patientId?: string; status?: MedicationStatus }
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.listMedications(request.auth.uid, opts)
  }
)

export const scheduleMedicationDose = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { medicationId, scheduledFor } = request.data as { medicationId: string; scheduledFor: string }
    if (!medicationId || !scheduledFor) throw new HttpsError('invalid-argument', 'medicationId and scheduledFor required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.scheduleDose(request.auth.uid, medicationId, scheduledFor)
  }
)

export const recordMedicationDose = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { medicationId, doseId, status } = request.data as { medicationId: string; doseId: string; status: DoseStatus }
    if (!medicationId || !doseId || !status) throw new HttpsError('invalid-argument', 'medicationId, doseId, status required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    await engine.recordDose(request.auth.uid, medicationId, doseId, status)
    return { success: true }
  }
)

export const setMedicationRefillDate = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { medicationId, refillDate } = request.data as { medicationId: string; refillDate: string }
    if (!medicationId || !refillDate) throw new HttpsError('invalid-argument', 'medicationId and refillDate required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    await engine.setRefillDate(request.auth.uid, medicationId, refillDate)
    return { success: true }
  }
)

// ── Vaccinations ──────────────────────────────────────────────────────────────

export const scheduleVaccination = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const fields = request.data as Omit<Vaccination, 'id' | 'userId' | 'status' | 'isBooster' | 'createdAt' | 'updatedAt'> & { isBooster?: boolean }
    if (!fields?.patientId || !fields?.vaccineName) throw new HttpsError('invalid-argument', 'patientId and vaccineName required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.scheduleVaccination(request.auth.uid, fields)
  }
)

export const markVaccinationCompleted = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { vaccinationId, facilityId } = request.data as { vaccinationId: string; facilityId?: string }
    if (!vaccinationId) throw new HttpsError('invalid-argument', 'vaccinationId required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    await engine.markVaccinationCompleted(request.auth.uid, vaccinationId, facilityId)
    return { success: true }
  }
)

export const listVaccinations = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const opts = (request.data ?? {}) as { patientId?: string; status?: VaccinationStatus }
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.listVaccinations(request.auth.uid, opts)
  }
)

export const vaccinationDueList = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { withinDays } = (request.data ?? {}) as { withinDays?: number }
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.vaccinationDueList(request.auth.uid, withinDays ?? 14)
  }
)

// ── Disease Knowledge & Programs ─────────────────────────────────────────────

export const registerDisease = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const fields = request.data as Omit<DiseaseInfo, 'id' | 'createdAt' | 'updatedAt'>
    if (!fields?.name) throw new HttpsError('invalid-argument', 'name required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.registerDisease(request.auth.uid, fields)
  }
)

export const listDiseases = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { programId } = (request.data ?? {}) as { programId?: string }
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.listDiseases(request.auth.uid, programId)
  }
)

export const registerHealthProgram = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const program = request.data as HealthProgram
    if (!program?.id || !program?.name) throw new HttpsError('invalid-argument', 'id and name required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    await engine.registerProgram(request.auth.uid, program)
    return { success: true }
  }
)

export const listHealthPrograms = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.listPrograms(request.auth.uid)
  }
)

// ── Clinical Decision Support ─────────────────────────────────────────────────

export const generateDecisionSupport = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { patientId } = request.data as { patientId: string }
    if (!patientId) throw new HttpsError('invalid-argument', 'patientId required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.generateDecisionSupport(request.auth.uid, patientId)
  }
)

// ── Analytics ─────────────────────────────────────────────────────────────────

export const getHealthStats = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.getStats(request.auth.uid)
  }
)

// ── Reminders / Suggestions ───────────────────────────────────────────────────

export const runHealthReminderChecks = onCall(
  { timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.runReminderChecks(request.auth.uid)
  }
)

export const listHealthSuggestions = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.listPendingSuggestions(request.auth.uid)
  }
)

export const dismissHealthSuggestion = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { suggestionId } = request.data as { suggestionId: string }
    if (!suggestionId) throw new HttpsError('invalid-argument', 'suggestionId required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    await engine.dismissSuggestion(request.auth.uid, suggestionId)
    return { success: true }
  }
)

export const generateFollowUpReminder = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { patientId, reason } = request.data as { patientId: string; reason: string }
    if (!patientId || !reason) throw new HttpsError('invalid-argument', 'patientId and reason required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    return engine.generateFollowUpReminder(request.auth.uid, patientId, reason)
  }
)

// ── Document Intelligence Integration ────────────────────────────────────────

export const linkMedicalReport = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { patientId, documentId, extractedSummary } = request.data as {
      patientId: string; documentId: string; extractedSummary: string
    }
    if (!patientId || !documentId) throw new HttpsError('invalid-argument', 'patientId and documentId required')
    const engine = getHealthEngine(request.auth.uid, db(), apiKey())
    await engine.linkMedicalReport(request.auth.uid, patientId, documentId, extractedSummary ?? '')
    return { success: true }
  }
)
