"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthEngine = void 0;
const HealthRegistry_1 = require("./HealthRegistry");
const PatientManager_1 = require("./PatientManager");
const FacilityManager_1 = require("./FacilityManager");
const AppointmentManager_1 = require("./AppointmentManager");
const MedicationManager_1 = require("./MedicationManager");
const VaccinationManager_1 = require("./VaccinationManager");
const DiseaseKnowledge_1 = require("./DiseaseKnowledge");
const ClinicalDecisionSupport_1 = require("./ClinicalDecisionSupport");
const HealthAnalytics_1 = require("./HealthAnalytics");
const HealthScheduler_1 = require("./HealthScheduler");
const HealthEvents_1 = require("./HealthEvents");
const memory_graph_1 = require("../memory-graph");
class HealthEngine {
    constructor(db, config, apiKey) {
        this.db = db;
        this.apiKey = apiKey;
        this.registry = new HealthRegistry_1.HealthRegistry();
        this.patients = new PatientManager_1.PatientManager(db);
        this.facilities = new FacilityManager_1.FacilityManager(db);
        this.appointments = new AppointmentManager_1.AppointmentManager(db);
        this.medications = new MedicationManager_1.MedicationManager(db);
        this.vaccinations = new VaccinationManager_1.VaccinationManager(db);
        this.diseases = new DiseaseKnowledge_1.DiseaseKnowledge(db);
        this.decisionSupport = new ClinicalDecisionSupport_1.ClinicalDecisionSupport(apiKey, config.decisionSupportBudgetTokens);
        this.analytics = new HealthAnalytics_1.HealthAnalytics(db);
        this.scheduler = new HealthScheduler_1.HealthScheduler(db, this.appointments, this.medications, this.vaccinations, config.reminderLeadMinutes, config.refillReminderLeadDays, config.vaccinationDueWindowDays);
    }
    // ── Provider Management ───────────────────────────────────────────────────
    registerProvider(provider) {
        this.registry.registerProvider(provider);
    }
    listProviders() {
        return this.registry.listRegistered();
    }
    async healthCheckAll(userId) {
        return Promise.all(this.registry.listProviders().map((p) => p.healthCheck(userId)));
    }
    // ── Patients ──────────────────────────────────────────────────────────────
    async createPatient(userId, demographics, tags) {
        const patient = await this.patients.createPatient(userId, demographics, tags);
        void HealthEvents_1.HealthEvents.emit('patient:created', userId, { patientId: patient.id });
        void this.linkPatientToMemory(userId, patient);
        return patient;
    }
    async getPatient(userId, patientId) {
        return this.patients.getPatient(userId, patientId);
    }
    async listPatients(userId, limit) {
        return this.patients.listPatients(userId, limit);
    }
    async addVisit(userId, patientId, visit) {
        return this.patients.addVisit(userId, patientId, visit);
    }
    async addAllergy(userId, patientId, allergy) {
        return this.patients.addAllergy(userId, patientId, allergy);
    }
    async addMedicalHistory(userId, patientId, entry) {
        return this.patients.addMedicalHistory(userId, patientId, entry);
    }
    async addLabResult(userId, patientId, result) {
        return this.patients.addLabResult(userId, patientId, result);
    }
    // ── Facilities & Providers ────────────────────────────────────────────────
    async createFacility(userId, fields) {
        const facility = await this.facilities.createFacility(userId, fields);
        void this.linkFacilityToMemory(userId, facility);
        return facility;
    }
    async listFacilities(userId, type) {
        return this.facilities.listFacilities(userId, type);
    }
    async createHealthcareProvider(userId, fields) {
        return this.facilities.createProvider(userId, fields);
    }
    async listHealthcareProviders(userId, role) {
        return this.facilities.listProviders(userId, role);
    }
    // ── Appointments ──────────────────────────────────────────────────────────
    async scheduleAppointment(userId, fields) {
        const appt = await this.appointments.schedule(userId, fields);
        void this.linkAppointmentToMemory(userId, appt);
        return appt;
    }
    async rescheduleAppointment(userId, appointmentId, newTime) {
        return this.appointments.reschedule(userId, appointmentId, newTime);
    }
    async cancelAppointment(userId, appointmentId) {
        return this.appointments.cancel(userId, appointmentId);
    }
    async completeAppointment(userId, appointmentId) {
        return this.appointments.complete(userId, appointmentId);
    }
    async setAppointmentTravelTime(userId, appointmentId, minutes) {
        return this.appointments.setTravelTime(userId, appointmentId, minutes);
    }
    async listAppointments(userId, opts) {
        return this.appointments.list(userId, opts ?? {});
    }
    async createRecurringAppointments(userId, base, rule, occurrences) {
        return this.appointments.createRecurringSeries(userId, base, rule, occurrences);
    }
    // ── Medication ────────────────────────────────────────────────────────────
    async addMedication(userId, fields) {
        const med = await this.medications.addMedication(userId, fields);
        void this.linkMedicationToMemory(userId, med);
        return med;
    }
    async updateMedicationStatus(userId, medicationId, status) {
        return this.medications.updateStatus(userId, medicationId, status);
    }
    async listMedications(userId, opts) {
        return this.medications.list(userId, opts ?? {});
    }
    async scheduleDose(userId, medicationId, scheduledFor) {
        return this.medications.scheduleDose(userId, medicationId, scheduledFor);
    }
    async recordDose(userId, medicationId, doseId, status) {
        return this.medications.recordDose(userId, medicationId, doseId, status);
    }
    async setRefillDate(userId, medicationId, refillDate) {
        return this.medications.setRefillDate(userId, medicationId, refillDate);
    }
    // ── Vaccination ───────────────────────────────────────────────────────────
    async scheduleVaccination(userId, fields) {
        const vac = await this.vaccinations.schedule(userId, fields);
        void this.linkVaccinationToMemory(userId, vac);
        return vac;
    }
    async markVaccinationCompleted(userId, vaccinationId, facilityId) {
        return this.vaccinations.markCompleted(userId, vaccinationId, facilityId);
    }
    async listVaccinations(userId, opts) {
        return this.vaccinations.list(userId, opts ?? {});
    }
    async vaccinationDueList(userId, withinDays) {
        return this.vaccinations.dueList(userId, withinDays);
    }
    // ── Disease Knowledge / Programs ──────────────────────────────────────────
    async registerDisease(userId, fields) {
        return this.diseases.registerDisease(userId, fields);
    }
    async listDiseases(userId, programId) {
        return this.diseases.listDiseases(userId, programId);
    }
    async registerProgram(userId, program) {
        return this.diseases.registerProgram(userId, program);
    }
    async listPrograms(userId) {
        return this.diseases.listPrograms(userId);
    }
    // ── Clinical Decision Support ─────────────────────────────────────────────
    async generateDecisionSupport(userId, patientId) {
        const patient = await this.patients.getPatient(userId, patientId);
        if (!patient)
            throw new Error('Patient not found');
        const medications = await this.medications.list(userId, { patientId, status: 'active' });
        const conditionNames = patient.medicalHistory.map((h) => h.condition);
        const allDiseases = await this.diseases.listDiseases(userId);
        const relevantDiseases = allDiseases.filter((d) => conditionNames.includes(d.name));
        const result = await this.decisionSupport.generateSupport(patient, medications, relevantDiseases);
        void HealthEvents_1.HealthEvents.emit('decision_support:generated', userId, { patientId, recommendationCount: result.recommendations.length });
        return result;
    }
    registerDecisionSupportRule(rule) {
        this.decisionSupport.registerRule(rule);
    }
    // ── Analytics ─────────────────────────────────────────────────────────────
    async getStats(userId) {
        return this.analytics.getStats(userId);
    }
    // ── Suggestions / Scheduler ───────────────────────────────────────────────
    async runReminderChecks(userId) {
        return this.scheduler.runAllChecks(userId);
    }
    async listPendingSuggestions(userId) {
        return this.scheduler.listPendingSuggestions(userId);
    }
    async dismissSuggestion(userId, suggestionId) {
        return this.scheduler.dismissSuggestion(userId, suggestionId);
    }
    async generateFollowUpReminder(userId, patientId, reason) {
        return this.scheduler.generateFollowUpReminder(userId, patientId, reason);
    }
    // ── Document Intelligence Integration ────────────────────────────────────
    // Medical reports flow: OCR (DocumentParser) -> Entity Extraction -> Memory
    // Graph -> Patient Timeline. The health module never duplicates document
    // parsing logic — it consumes an already-ingested document's extracted text
    // and links results onto the patient record.
    async linkMedicalReport(userId, patientId, documentId, extractedSummary) {
        await this.patients.linkDocument(userId, patientId, documentId);
        await this.patients.addVisit(userId, patientId, {
            facilityId: undefined,
            providerId: undefined,
            date: new Date().toISOString(),
            reason: 'Medical report imported',
            notes: extractedSummary,
        });
        void HealthEvents_1.HealthEvents.emit('report:ingested', userId, { patientId, documentId });
        void this.linkReportToMemory(userId, patientId, documentId, extractedSummary);
    }
    // ── Memory Graph Integration ──────────────────────────────────────────────
    // Patient -> Visits -> Facility -> Doctor -> Medication -> Documents -> Appointments
    async linkPatientToMemory(userId, patient) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            const { node } = await graph.upsertNode('person', patient.demographics.fullName, `Patient record${patient.demographics.dateOfBirth ? ` (DOB ${patient.demographics.dateOfBirth})` : ''}`, { patientId: patient.id, contactId: patient.demographics.contactId }, 60);
            await this.patients.setMemoryNodeId(userId, patient.id, node.id);
        }
        catch {
            // best-effort
        }
    }
    async linkFacilityToMemory(userId, facility) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            const { node } = await graph.upsertNode('hospital', facility.name, `${facility.type} facility`, { facilityId: facility.id, address: facility.address }, 40);
            await this.facilities.setMemoryNodeId(userId, facility.id, node.id);
        }
        catch {
            // best-effort
        }
    }
    async linkAppointmentToMemory(userId, appt) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            const patient = await this.patients.getPatient(userId, appt.patientId);
            const { node: apptNode } = await graph.upsertNode('meeting', `Appointment for ${patient?.demographics.fullName ?? appt.patientId}`, `${appt.type} appointment on ${appt.scheduledFor}`, { appointmentId: appt.id, status: appt.status }, 30);
            if (patient?.memoryNodeId) {
                await graph.upsertEdge(patient.memoryNodeId, apptNode.id, 'ATTENDED', { weight: 0.6, confidence: 0.8 });
            }
        }
        catch {
            // best-effort
        }
    }
    async linkMedicationToMemory(userId, med) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            const patient = await this.patients.getPatient(userId, med.patientId);
            const { node: medNode } = await graph.upsertNode('health_record', med.name, `Medication: ${med.dosage}, ${med.frequency}`, { medicationId: med.id }, 25);
            if (patient?.memoryNodeId) {
                await graph.upsertEdge(patient.memoryNodeId, medNode.id, 'RELATED_TO', { weight: 0.5, confidence: 0.7 });
            }
        }
        catch {
            // best-effort
        }
    }
    async linkVaccinationToMemory(userId, vac) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            const patient = await this.patients.getPatient(userId, vac.patientId);
            const { node: vacNode } = await graph.upsertNode('health_record', `${vac.vaccineName} (dose ${vac.doseNumber})`, `Vaccination scheduled for ${vac.scheduledFor}`, { vaccinationId: vac.id }, 25);
            if (patient?.memoryNodeId) {
                await graph.upsertEdge(patient.memoryNodeId, vacNode.id, 'RELATED_TO', { weight: 0.5, confidence: 0.7 });
            }
        }
        catch {
            // best-effort
        }
    }
    async linkReportToMemory(userId, patientId, documentId, summary) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            const patient = await this.patients.getPatient(userId, patientId);
            const { node: docNode } = await graph.upsertNode('document', `Medical report ${documentId}`, summary.slice(0, 300), { documentId, patientId }, 35);
            if (patient?.memoryNodeId) {
                await graph.upsertEdge(patient.memoryNodeId, docNode.id, 'RELATED_TO', { weight: 0.7, confidence: 0.85 });
            }
        }
        catch {
            // best-effort
        }
    }
}
exports.HealthEngine = HealthEngine;
//# sourceMappingURL=HealthEngine.js.map