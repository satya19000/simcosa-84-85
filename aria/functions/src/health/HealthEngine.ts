import type * as admin from 'firebase-admin'
import type {
  Patient, PatientDemographics, PatientVisit, PatientAllergy, PatientMedicalHistoryEntry, LabResult,
  HealthFacility, FacilityType, HealthcareProvider, ProviderRole,
  Appointment, AppointmentStatus, RecurrenceRule,
  Medication, MedicationStatus, DoseStatus,
  Vaccination, VaccinationStatus,
  DiseaseInfo, HealthProgram,
  DecisionSupportResult,
  HealthStats, HealthSuggestion,
} from './HealthTypes'
import type { HealthConfig } from './HealthConfig'
import type { HealthProvider } from './HealthProvider'
import { HealthRegistry } from './HealthRegistry'
import { PatientManager } from './PatientManager'
import { FacilityManager } from './FacilityManager'
import { AppointmentManager } from './AppointmentManager'
import { MedicationManager } from './MedicationManager'
import { VaccinationManager } from './VaccinationManager'
import { DiseaseKnowledge } from './DiseaseKnowledge'
import { ClinicalDecisionSupport } from './ClinicalDecisionSupport'
import { HealthAnalytics } from './HealthAnalytics'
import { HealthScheduler } from './HealthScheduler'
import { HealthEvents } from './HealthEvents'
import { getMemoryGraph } from '../memory-graph'

export class HealthEngine {
  private readonly registry: HealthRegistry
  private readonly patients: PatientManager
  private readonly facilities: FacilityManager
  private readonly appointments: AppointmentManager
  private readonly medications: MedicationManager
  private readonly vaccinations: VaccinationManager
  private readonly diseases: DiseaseKnowledge
  private readonly decisionSupport: ClinicalDecisionSupport
  private readonly analytics: HealthAnalytics
  private readonly scheduler: HealthScheduler

  constructor(
    private readonly db: admin.firestore.Firestore,
    config: HealthConfig,
    private readonly apiKey: string
  ) {
    this.registry = new HealthRegistry()
    this.patients = new PatientManager(db)
    this.facilities = new FacilityManager(db)
    this.appointments = new AppointmentManager(db)
    this.medications = new MedicationManager(db)
    this.vaccinations = new VaccinationManager(db)
    this.diseases = new DiseaseKnowledge(db)
    this.decisionSupport = new ClinicalDecisionSupport(apiKey, config.decisionSupportBudgetTokens)
    this.analytics = new HealthAnalytics(db)
    this.scheduler = new HealthScheduler(
      db, this.appointments, this.medications, this.vaccinations,
      config.reminderLeadMinutes, config.refillReminderLeadDays, config.vaccinationDueWindowDays
    )
  }

  // ── Provider Management ───────────────────────────────────────────────────

  registerProvider(provider: HealthProvider): void {
    this.registry.registerProvider(provider)
  }

  listProviders(): Array<{ id: string; name: string; type: string }> {
    return this.registry.listRegistered()
  }

  async healthCheckAll(userId: string) {
    return Promise.all(this.registry.listProviders().map((p) => p.healthCheck(userId)))
  }

  // ── Patients ──────────────────────────────────────────────────────────────

  async createPatient(userId: string, demographics: PatientDemographics, tags?: string[]): Promise<Patient> {
    const patient = await this.patients.createPatient(userId, demographics, tags)
    void HealthEvents.emit('patient:created', userId, { patientId: patient.id })
    void this.linkPatientToMemory(userId, patient)
    return patient
  }

  async getPatient(userId: string, patientId: string): Promise<Patient | null> {
    return this.patients.getPatient(userId, patientId)
  }

  async listPatients(userId: string, limit?: number): Promise<Patient[]> {
    return this.patients.listPatients(userId, limit)
  }

  async addVisit(userId: string, patientId: string, visit: Omit<PatientVisit, 'id'>): Promise<PatientVisit> {
    return this.patients.addVisit(userId, patientId, visit)
  }

  async addAllergy(userId: string, patientId: string, allergy: Omit<PatientAllergy, 'id'>): Promise<PatientAllergy> {
    return this.patients.addAllergy(userId, patientId, allergy)
  }

  async addMedicalHistory(userId: string, patientId: string, entry: Omit<PatientMedicalHistoryEntry, 'id'>): Promise<PatientMedicalHistoryEntry> {
    return this.patients.addMedicalHistory(userId, patientId, entry)
  }

  async addLabResult(userId: string, patientId: string, result: Omit<LabResult, 'id'>): Promise<LabResult> {
    return this.patients.addLabResult(userId, patientId, result)
  }

  // ── Facilities & Providers ────────────────────────────────────────────────

  async createFacility(userId: string, fields: Omit<HealthFacility, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<HealthFacility> {
    const facility = await this.facilities.createFacility(userId, fields)
    void this.linkFacilityToMemory(userId, facility)
    return facility
  }

  async listFacilities(userId: string, type?: FacilityType): Promise<HealthFacility[]> {
    return this.facilities.listFacilities(userId, type)
  }

  async createHealthcareProvider(userId: string, fields: Omit<HealthcareProvider, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<HealthcareProvider> {
    return this.facilities.createProvider(userId, fields)
  }

  async listHealthcareProviders(userId: string, role?: ProviderRole): Promise<HealthcareProvider[]> {
    return this.facilities.listProviders(userId, role)
  }

  // ── Appointments ──────────────────────────────────────────────────────────

  async scheduleAppointment(userId: string, fields: Omit<Appointment, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const appt = await this.appointments.schedule(userId, fields)
    void this.linkAppointmentToMemory(userId, appt)
    return appt
  }

  async rescheduleAppointment(userId: string, appointmentId: string, newTime: string): Promise<void> {
    return this.appointments.reschedule(userId, appointmentId, newTime)
  }

  async cancelAppointment(userId: string, appointmentId: string): Promise<void> {
    return this.appointments.cancel(userId, appointmentId)
  }

  async completeAppointment(userId: string, appointmentId: string): Promise<void> {
    return this.appointments.complete(userId, appointmentId)
  }

  async setAppointmentTravelTime(userId: string, appointmentId: string, minutes: number): Promise<void> {
    return this.appointments.setTravelTime(userId, appointmentId, minutes)
  }

  async listAppointments(userId: string, opts?: { patientId?: string; status?: AppointmentStatus; limit?: number }): Promise<Appointment[]> {
    return this.appointments.list(userId, opts ?? {})
  }

  async createRecurringAppointments(
    userId: string,
    base: Omit<Appointment, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt' | 'recurrence'>,
    rule: RecurrenceRule,
    occurrences: number
  ): Promise<Appointment[]> {
    return this.appointments.createRecurringSeries(userId, base, rule, occurrences)
  }

  // ── Medication ────────────────────────────────────────────────────────────

  async addMedication(userId: string, fields: Omit<Medication, 'id' | 'userId' | 'status' | 'doses' | 'createdAt' | 'updatedAt'>): Promise<Medication> {
    const med = await this.medications.addMedication(userId, fields)
    void this.linkMedicationToMemory(userId, med)
    return med
  }

  async updateMedicationStatus(userId: string, medicationId: string, status: MedicationStatus): Promise<void> {
    return this.medications.updateStatus(userId, medicationId, status)
  }

  async listMedications(userId: string, opts?: { patientId?: string; status?: MedicationStatus }): Promise<Medication[]> {
    return this.medications.list(userId, opts ?? {})
  }

  async scheduleDose(userId: string, medicationId: string, scheduledFor: string) {
    return this.medications.scheduleDose(userId, medicationId, scheduledFor)
  }

  async recordDose(userId: string, medicationId: string, doseId: string, status: DoseStatus): Promise<void> {
    return this.medications.recordDose(userId, medicationId, doseId, status)
  }

  async setRefillDate(userId: string, medicationId: string, refillDate: string): Promise<void> {
    return this.medications.setRefillDate(userId, medicationId, refillDate)
  }

  // ── Vaccination ───────────────────────────────────────────────────────────

  async scheduleVaccination(userId: string, fields: Omit<Vaccination, 'id' | 'userId' | 'status' | 'isBooster' | 'createdAt' | 'updatedAt'> & { isBooster?: boolean }): Promise<Vaccination> {
    const vac = await this.vaccinations.schedule(userId, fields)
    void this.linkVaccinationToMemory(userId, vac)
    return vac
  }

  async markVaccinationCompleted(userId: string, vaccinationId: string, facilityId?: string): Promise<void> {
    return this.vaccinations.markCompleted(userId, vaccinationId, facilityId)
  }

  async listVaccinations(userId: string, opts?: { patientId?: string; status?: VaccinationStatus }): Promise<Vaccination[]> {
    return this.vaccinations.list(userId, opts ?? {})
  }

  async vaccinationDueList(userId: string, withinDays: number): Promise<Vaccination[]> {
    return this.vaccinations.dueList(userId, withinDays)
  }

  // ── Disease Knowledge / Programs ──────────────────────────────────────────

  async registerDisease(userId: string, fields: Omit<DiseaseInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<DiseaseInfo> {
    return this.diseases.registerDisease(userId, fields)
  }

  async listDiseases(userId: string, programId?: string): Promise<DiseaseInfo[]> {
    return this.diseases.listDiseases(userId, programId)
  }

  async registerProgram(userId: string, program: HealthProgram): Promise<void> {
    return this.diseases.registerProgram(userId, program)
  }

  async listPrograms(userId: string): Promise<HealthProgram[]> {
    return this.diseases.listPrograms(userId)
  }

  // ── Clinical Decision Support ─────────────────────────────────────────────

  async generateDecisionSupport(userId: string, patientId: string): Promise<DecisionSupportResult> {
    const patient = await this.patients.getPatient(userId, patientId)
    if (!patient) throw new Error('Patient not found')
    const medications = await this.medications.list(userId, { patientId, status: 'active' })
    const conditionNames = patient.medicalHistory.map((h) => h.condition)
    const allDiseases = await this.diseases.listDiseases(userId)
    const relevantDiseases = allDiseases.filter((d) => conditionNames.includes(d.name))
    const result = await this.decisionSupport.generateSupport(patient, medications, relevantDiseases)
    void HealthEvents.emit('decision_support:generated', userId, { patientId, recommendationCount: result.recommendations.length })
    return result
  }

  registerDecisionSupportRule(rule: Parameters<ClinicalDecisionSupport['registerRule']>[0]): void {
    this.decisionSupport.registerRule(rule)
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  async getStats(userId: string): Promise<HealthStats> {
    return this.analytics.getStats(userId)
  }

  // ── Suggestions / Scheduler ───────────────────────────────────────────────

  async runReminderChecks(userId: string): Promise<{ generated: number }> {
    return this.scheduler.runAllChecks(userId)
  }

  async listPendingSuggestions(userId: string): Promise<HealthSuggestion[]> {
    return this.scheduler.listPendingSuggestions(userId)
  }

  async dismissSuggestion(userId: string, suggestionId: string): Promise<void> {
    return this.scheduler.dismissSuggestion(userId, suggestionId)
  }

  async generateFollowUpReminder(userId: string, patientId: string, reason: string): Promise<HealthSuggestion> {
    return this.scheduler.generateFollowUpReminder(userId, patientId, reason)
  }

  // ── Document Intelligence Integration ────────────────────────────────────
  // Medical reports flow: OCR (DocumentParser) -> Entity Extraction -> Memory
  // Graph -> Patient Timeline. The health module never duplicates document
  // parsing logic — it consumes an already-ingested document's extracted text
  // and links results onto the patient record.

  async linkMedicalReport(userId: string, patientId: string, documentId: string, extractedSummary: string): Promise<void> {
    await this.patients.linkDocument(userId, patientId, documentId)
    await this.patients.addVisit(userId, patientId, {
      facilityId: undefined,
      providerId: undefined,
      date: new Date().toISOString(),
      reason: 'Medical report imported',
      notes: extractedSummary,
    })
    void HealthEvents.emit('report:ingested', userId, { patientId, documentId })
    void this.linkReportToMemory(userId, patientId, documentId, extractedSummary)
  }

  // ── Memory Graph Integration ──────────────────────────────────────────────
  // Patient -> Visits -> Facility -> Doctor -> Medication -> Documents -> Appointments

  private async linkPatientToMemory(userId: string, patient: Patient): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      const { node } = await graph.upsertNode(
        'person',
        patient.demographics.fullName,
        `Patient record${patient.demographics.dateOfBirth ? ` (DOB ${patient.demographics.dateOfBirth})` : ''}`,
        { patientId: patient.id, contactId: patient.demographics.contactId },
        60
      )
      await this.patients.setMemoryNodeId(userId, patient.id, node.id)
    } catch {
      // best-effort
    }
  }

  private async linkFacilityToMemory(userId: string, facility: HealthFacility): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      const { node } = await graph.upsertNode(
        'hospital',
        facility.name,
        `${facility.type} facility`,
        { facilityId: facility.id, address: facility.address },
        40
      )
      await this.facilities.setMemoryNodeId(userId, facility.id, node.id)
    } catch {
      // best-effort
    }
  }

  private async linkAppointmentToMemory(userId: string, appt: Appointment): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      const patient = await this.patients.getPatient(userId, appt.patientId)
      const { node: apptNode } = await graph.upsertNode(
        'meeting',
        `Appointment for ${patient?.demographics.fullName ?? appt.patientId}`,
        `${appt.type} appointment on ${appt.scheduledFor}`,
        { appointmentId: appt.id, status: appt.status },
        30
      )
      if (patient?.memoryNodeId) {
        await graph.upsertEdge(patient.memoryNodeId, apptNode.id, 'ATTENDED', { weight: 0.6, confidence: 0.8 })
      }
    } catch {
      // best-effort
    }
  }

  private async linkMedicationToMemory(userId: string, med: Medication): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      const patient = await this.patients.getPatient(userId, med.patientId)
      const { node: medNode } = await graph.upsertNode(
        'health_record',
        med.name,
        `Medication: ${med.dosage}, ${med.frequency}`,
        { medicationId: med.id },
        25
      )
      if (patient?.memoryNodeId) {
        await graph.upsertEdge(patient.memoryNodeId, medNode.id, 'RELATED_TO', { weight: 0.5, confidence: 0.7 })
      }
    } catch {
      // best-effort
    }
  }

  private async linkVaccinationToMemory(userId: string, vac: Vaccination): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      const patient = await this.patients.getPatient(userId, vac.patientId)
      const { node: vacNode } = await graph.upsertNode(
        'health_record',
        `${vac.vaccineName} (dose ${vac.doseNumber})`,
        `Vaccination scheduled for ${vac.scheduledFor}`,
        { vaccinationId: vac.id },
        25
      )
      if (patient?.memoryNodeId) {
        await graph.upsertEdge(patient.memoryNodeId, vacNode.id, 'RELATED_TO', { weight: 0.5, confidence: 0.7 })
      }
    } catch {
      // best-effort
    }
  }

  private async linkReportToMemory(userId: string, patientId: string, documentId: string, summary: string): Promise<void> {
    try {
      const graph = getMemoryGraph(userId, this.db, this.apiKey)
      const patient = await this.patients.getPatient(userId, patientId)
      const { node: docNode } = await graph.upsertNode(
        'document',
        `Medical report ${documentId}`,
        summary.slice(0, 300),
        { documentId, patientId },
        35
      )
      if (patient?.memoryNodeId) {
        await graph.upsertEdge(patient.memoryNodeId, docNode.id, 'RELATED_TO', { weight: 0.7, confidence: 0.85 })
      }
    } catch {
      // best-effort
    }
  }
}
