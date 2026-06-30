import { httpsCallable } from 'firebase/functions'
import { functions as fns } from './firebase'

const getHealthProviderHealthFn = httpsCallable(fns, 'getHealthProviderHealth')
const listHealthProvidersFn = httpsCallable(fns, 'listHealthProviders')
const createPatientFn = httpsCallable(fns, 'createPatient')
const getPatientFn = httpsCallable(fns, 'getPatient')
const listPatientsFn = httpsCallable(fns, 'listPatients')
const addPatientVisitFn = httpsCallable(fns, 'addPatientVisit')
const addPatientAllergyFn = httpsCallable(fns, 'addPatientAllergy')
const addPatientMedicalHistoryFn = httpsCallable(fns, 'addPatientMedicalHistory')
const addPatientLabResultFn = httpsCallable(fns, 'addPatientLabResult')
const createHealthFacilityFn = httpsCallable(fns, 'createHealthFacility')
const listHealthFacilitiesFn = httpsCallable(fns, 'listHealthFacilities')
const createHealthcareProviderFn = httpsCallable(fns, 'createHealthcareProvider')
const listHealthcareProvidersFn = httpsCallable(fns, 'listHealthcareProviders')
const scheduleAppointmentFn = httpsCallable(fns, 'scheduleAppointment')
const rescheduleAppointmentFn = httpsCallable(fns, 'rescheduleAppointment')
const cancelAppointmentFn = httpsCallable(fns, 'cancelAppointment')
const completeAppointmentFn = httpsCallable(fns, 'completeAppointment')
const setAppointmentTravelTimeFn = httpsCallable(fns, 'setAppointmentTravelTime')
const listAppointmentsFn = httpsCallable(fns, 'listAppointments')
const createRecurringAppointmentsFn = httpsCallable(fns, 'createRecurringAppointments')
const addMedicationFn = httpsCallable(fns, 'addMedication')
const updateMedicationStatusFn = httpsCallable(fns, 'updateMedicationStatus')
const listMedicationsFn = httpsCallable(fns, 'listMedications')
const scheduleMedicationDoseFn = httpsCallable(fns, 'scheduleMedicationDose')
const recordMedicationDoseFn = httpsCallable(fns, 'recordMedicationDose')
const setMedicationRefillDateFn = httpsCallable(fns, 'setMedicationRefillDate')
const scheduleVaccinationFn = httpsCallable(fns, 'scheduleVaccination')
const markVaccinationCompletedFn = httpsCallable(fns, 'markVaccinationCompleted')
const listVaccinationsFn = httpsCallable(fns, 'listVaccinations')
const vaccinationDueListFn = httpsCallable(fns, 'vaccinationDueList')
const registerDiseaseFn = httpsCallable(fns, 'registerDisease')
const listDiseasesFn = httpsCallable(fns, 'listDiseases')
const registerHealthProgramFn = httpsCallable(fns, 'registerHealthProgram')
const listHealthProgramsFn = httpsCallable(fns, 'listHealthPrograms')
const generateDecisionSupportFn = httpsCallable(fns, 'generateDecisionSupport')
const getHealthStatsFn = httpsCallable(fns, 'getHealthStats')
const runHealthReminderChecksFn = httpsCallable(fns, 'runHealthReminderChecks')
const listHealthSuggestionsFn = httpsCallable(fns, 'listHealthSuggestions')
const dismissHealthSuggestionFn = httpsCallable(fns, 'dismissHealthSuggestion')
const generateFollowUpReminderFn = httpsCallable(fns, 'generateFollowUpReminder')
const linkMedicalReportFn = httpsCallable(fns, 'linkMedicalReport')

export type FacilityType = 'hospital' | 'clinic' | 'phc' | 'uphc' | 'district_hospital' | 'laboratory' | 'pharmacy' | 'custom'
export type ProviderRole = 'doctor' | 'nurse' | 'health_worker' | 'admin' | 'custom'
export type AppointmentStatus = 'scheduled' | 'rescheduled' | 'cancelled' | 'completed' | 'missed'
export type MedicationStatus = 'active' | 'completed' | 'discontinued'
export type DoseStatus = 'pending' | 'taken' | 'missed' | 'skipped'
export type VaccinationStatus = 'due' | 'upcoming' | 'completed' | 'missed'

export interface ProviderHealth {
  providerId: string
  status: string
  lastCheckedAt: string
  latencyMs?: number
  error?: string
}

export interface PatientDemographics {
  fullName: string
  dateOfBirth?: string
  gender?: string
  phone?: string
  email?: string
  address?: string
  contactId?: string
}

export interface Patient {
  id: string
  userId: string
  demographics: PatientDemographics
  visits: Array<{ id: string; facilityId?: string; providerId?: string; date: string; reason: string; notes?: string }>
  allergies: Array<{ id: string; substance: string; reaction?: string; severity?: string }>
  medicalHistory: Array<{ id: string; condition: string; diagnosedAt?: string; notes?: string }>
  labResults: Array<{ id: string; testName: string; value: string; unit?: string; date: string }>
  documentIds: string[]
  memoryNodeId?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface HealthFacility {
  id: string
  userId: string
  name: string
  type: FacilityType
  address?: string
  phone?: string
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

export interface Appointment {
  id: string
  userId: string
  patientId: string
  facilityId?: string
  providerId?: string
  type: string
  status: AppointmentStatus
  scheduledFor: string
  durationMinutes: number
  reminderScheduled?: boolean
  travelTimeMinutes?: number
  createdAt: string
  updatedAt: string
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
  refillDate?: string
  doses: Array<{ id: string; scheduledFor: string; status: DoseStatus; takenAt?: string }>
  createdAt: string
  updatedAt: string
}

export interface Vaccination {
  id: string
  userId: string
  patientId: string
  vaccineName: string
  doseNumber: number
  status: VaccinationStatus
  scheduledFor: string
  administeredAt?: string
  isBooster: boolean
  createdAt: string
  updatedAt: string
}

export interface DiseaseInfo {
  id: string
  name: string
  symptoms: string[]
  riskFactors: string[]
  guidelines: string[]
  referenceLinks?: string[]
  programId?: string
  createdAt: string
  updatedAt: string
}

export interface HealthProgram {
  id: string
  name: string
  description?: string
  diseaseIds?: string[]
}

export interface DecisionSupportResult {
  patientId: string
  recommendations: Array<{ rule: string; text: string; severity: 'info' | 'warning' | 'alert' }>
  checklists: string[]
  missingInformation: string[]
  generatedAt: string
  disclaimer: string
}

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

export interface HealthSuggestion {
  id: string
  patientId: string
  type: string
  title: string
  description: string
  requiresApproval: true
  createdAt: string
}

export async function getHealthProviderHealth(): Promise<ProviderHealth[]> {
  const result = await getHealthProviderHealthFn({})
  return result.data as ProviderHealth[]
}

export async function listHealthProviders(): Promise<Array<{ id: string; name: string; type: string }>> {
  const result = await listHealthProvidersFn({})
  return result.data as Array<{ id: string; name: string; type: string }>
}

export async function createPatient(demographics: PatientDemographics, tags?: string[]): Promise<Patient> {
  const result = await createPatientFn({ demographics, tags })
  return result.data as Patient
}

export async function getPatient(patientId: string): Promise<Patient | null> {
  const result = await getPatientFn({ patientId })
  return result.data as Patient | null
}

export async function listPatients(limit?: number): Promise<Patient[]> {
  const result = await listPatientsFn({ limit })
  return result.data as Patient[]
}

export async function addPatientVisit(patientId: string, visit: { facilityId?: string; providerId?: string; date: string; reason: string; notes?: string }) {
  const result = await addPatientVisitFn({ patientId, visit })
  return result.data
}

export async function addPatientAllergy(patientId: string, allergy: { substance: string; reaction?: string; severity?: string }) {
  const result = await addPatientAllergyFn({ patientId, allergy })
  return result.data
}

export async function addPatientMedicalHistory(patientId: string, entry: { condition: string; diagnosedAt?: string; notes?: string }) {
  const result = await addPatientMedicalHistoryFn({ patientId, entry })
  return result.data
}

export async function addPatientLabResult(patientId: string, result_: { testName: string; value: string; unit?: string; date: string }) {
  const result = await addPatientLabResultFn({ patientId, result: result_ })
  return result.data
}

export async function createHealthFacility(fields: Omit<HealthFacility, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<HealthFacility> {
  const result = await createHealthFacilityFn(fields)
  return result.data as HealthFacility
}

export async function listHealthFacilities(type?: FacilityType): Promise<HealthFacility[]> {
  const result = await listHealthFacilitiesFn({ type })
  return result.data as HealthFacility[]
}

export async function createHealthcareProvider(fields: Omit<HealthcareProvider, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<HealthcareProvider> {
  const result = await createHealthcareProviderFn(fields)
  return result.data as HealthcareProvider
}

export async function listHealthcareProviders(role?: ProviderRole): Promise<HealthcareProvider[]> {
  const result = await listHealthcareProvidersFn({ role })
  return result.data as HealthcareProvider[]
}

export async function scheduleAppointment(fields: Omit<Appointment, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
  const result = await scheduleAppointmentFn(fields)
  return result.data as Appointment
}

export async function rescheduleAppointment(appointmentId: string, newTime: string): Promise<void> {
  await rescheduleAppointmentFn({ appointmentId, newTime })
}

export async function cancelAppointment(appointmentId: string): Promise<void> {
  await cancelAppointmentFn({ appointmentId })
}

export async function completeAppointment(appointmentId: string): Promise<void> {
  await completeAppointmentFn({ appointmentId })
}

export async function setAppointmentTravelTime(appointmentId: string, minutes: number): Promise<void> {
  await setAppointmentTravelTimeFn({ appointmentId, minutes })
}

export async function listAppointments(opts?: { patientId?: string; status?: AppointmentStatus; limit?: number }): Promise<Appointment[]> {
  const result = await listAppointmentsFn(opts ?? {})
  return result.data as Appointment[]
}

export async function createRecurringAppointments(
  base: Omit<Appointment, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>,
  rule: 'daily' | 'weekly' | 'monthly',
  occurrences: number
): Promise<Appointment[]> {
  const result = await createRecurringAppointmentsFn({ base, rule, occurrences })
  return result.data as Appointment[]
}

export async function addMedication(fields: Omit<Medication, 'id' | 'userId' | 'status' | 'doses' | 'createdAt' | 'updatedAt'>): Promise<Medication> {
  const result = await addMedicationFn(fields)
  return result.data as Medication
}

export async function updateMedicationStatus(medicationId: string, status: MedicationStatus): Promise<void> {
  await updateMedicationStatusFn({ medicationId, status })
}

export async function listMedications(opts?: { patientId?: string; status?: MedicationStatus }): Promise<Medication[]> {
  const result = await listMedicationsFn(opts ?? {})
  return result.data as Medication[]
}

export async function scheduleMedicationDose(medicationId: string, scheduledFor: string) {
  const result = await scheduleMedicationDoseFn({ medicationId, scheduledFor })
  return result.data
}

export async function recordMedicationDose(medicationId: string, doseId: string, status: DoseStatus): Promise<void> {
  await recordMedicationDoseFn({ medicationId, doseId, status })
}

export async function setMedicationRefillDate(medicationId: string, refillDate: string): Promise<void> {
  await setMedicationRefillDateFn({ medicationId, refillDate })
}

export async function scheduleVaccination(fields: Omit<Vaccination, 'id' | 'userId' | 'status' | 'isBooster' | 'createdAt' | 'updatedAt'> & { isBooster?: boolean }): Promise<Vaccination> {
  const result = await scheduleVaccinationFn(fields)
  return result.data as Vaccination
}

export async function markVaccinationCompleted(vaccinationId: string, facilityId?: string): Promise<void> {
  await markVaccinationCompletedFn({ vaccinationId, facilityId })
}

export async function listVaccinations(opts?: { patientId?: string; status?: VaccinationStatus }): Promise<Vaccination[]> {
  const result = await listVaccinationsFn(opts ?? {})
  return result.data as Vaccination[]
}

export async function vaccinationDueList(withinDays?: number): Promise<Vaccination[]> {
  const result = await vaccinationDueListFn({ withinDays })
  return result.data as Vaccination[]
}

export async function registerDisease(fields: Omit<DiseaseInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<DiseaseInfo> {
  const result = await registerDiseaseFn(fields)
  return result.data as DiseaseInfo
}

export async function listDiseases(programId?: string): Promise<DiseaseInfo[]> {
  const result = await listDiseasesFn({ programId })
  return result.data as DiseaseInfo[]
}

export async function registerHealthProgram(program: HealthProgram): Promise<void> {
  await registerHealthProgramFn(program)
}

export async function listHealthPrograms(): Promise<HealthProgram[]> {
  const result = await listHealthProgramsFn({})
  return result.data as HealthProgram[]
}

export async function generateDecisionSupport(patientId: string): Promise<DecisionSupportResult> {
  const result = await generateDecisionSupportFn({ patientId })
  return result.data as DecisionSupportResult
}

export async function getHealthStats(): Promise<HealthStats> {
  const result = await getHealthStatsFn({})
  return result.data as HealthStats
}

export async function runHealthReminderChecks(): Promise<{ generated: number }> {
  const result = await runHealthReminderChecksFn({})
  return result.data as { generated: number }
}

export async function listHealthSuggestions(): Promise<HealthSuggestion[]> {
  const result = await listHealthSuggestionsFn({})
  return result.data as HealthSuggestion[]
}

export async function dismissHealthSuggestion(suggestionId: string): Promise<void> {
  await dismissHealthSuggestionFn({ suggestionId })
}

export async function generateFollowUpReminder(patientId: string, reason: string): Promise<HealthSuggestion> {
  const result = await generateFollowUpReminderFn({ patientId, reason })
  return result.data as HealthSuggestion
}

export async function linkMedicalReport(patientId: string, documentId: string, extractedSummary: string): Promise<void> {
  await linkMedicalReportFn({ patientId, documentId, extractedSummary })
}
