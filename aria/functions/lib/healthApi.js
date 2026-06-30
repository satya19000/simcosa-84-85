"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkMedicalReport = exports.generateFollowUpReminder = exports.dismissHealthSuggestion = exports.listHealthSuggestions = exports.runHealthReminderChecks = exports.getHealthStats = exports.generateDecisionSupport = exports.listHealthPrograms = exports.registerHealthProgram = exports.listDiseases = exports.registerDisease = exports.vaccinationDueList = exports.listVaccinations = exports.markVaccinationCompleted = exports.scheduleVaccination = exports.setMedicationRefillDate = exports.recordMedicationDose = exports.scheduleMedicationDose = exports.listMedications = exports.updateMedicationStatus = exports.addMedication = exports.createRecurringAppointments = exports.listAppointments = exports.setAppointmentTravelTime = exports.completeAppointment = exports.cancelAppointment = exports.rescheduleAppointment = exports.scheduleAppointment = exports.listHealthcareProviders = exports.createHealthcareProvider = exports.listHealthFacilities = exports.createHealthFacility = exports.addPatientLabResult = exports.addPatientMedicalHistory = exports.addPatientAllergy = exports.addPatientVisit = exports.listPatients = exports.getPatient = exports.createPatient = exports.listHealthProviders = exports.getHealthProviderHealth = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const health_1 = require("./health");
function db() {
    return admin.firestore();
}
function apiKey() {
    return process.env.ANTHROPIC_API_KEY ?? '';
}
// ── Providers ─────────────────────────────────────────────────────────────────
exports.getHealthProviderHealth = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.healthCheckAll(request.auth.uid);
});
exports.listHealthProviders = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.listProviders();
});
// ── Patients ──────────────────────────────────────────────────────────────────
exports.createPatient = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { demographics, tags } = request.data;
    if (!demographics?.fullName)
        throw new https_1.HttpsError('invalid-argument', 'demographics.fullName required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.createPatient(request.auth.uid, demographics, tags);
});
exports.getPatient = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { patientId } = request.data;
    if (!patientId)
        throw new https_1.HttpsError('invalid-argument', 'patientId required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.getPatient(request.auth.uid, patientId);
});
exports.listPatients = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { limit } = (request.data ?? {});
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.listPatients(request.auth.uid, limit);
});
exports.addPatientVisit = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { patientId, visit } = request.data;
    if (!patientId || !visit)
        throw new https_1.HttpsError('invalid-argument', 'patientId and visit required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.addVisit(request.auth.uid, patientId, visit);
});
exports.addPatientAllergy = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { patientId, allergy } = request.data;
    if (!patientId || !allergy)
        throw new https_1.HttpsError('invalid-argument', 'patientId and allergy required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.addAllergy(request.auth.uid, patientId, allergy);
});
exports.addPatientMedicalHistory = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { patientId, entry } = request.data;
    if (!patientId || !entry)
        throw new https_1.HttpsError('invalid-argument', 'patientId and entry required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.addMedicalHistory(request.auth.uid, patientId, entry);
});
exports.addPatientLabResult = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { patientId, result } = request.data;
    if (!patientId || !result)
        throw new https_1.HttpsError('invalid-argument', 'patientId and result required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.addLabResult(request.auth.uid, patientId, result);
});
// ── Facilities & Providers ───────────────────────────────────────────────────
exports.createHealthFacility = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const fields = request.data;
    if (!fields?.name || !fields?.type)
        throw new https_1.HttpsError('invalid-argument', 'name and type required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.createFacility(request.auth.uid, fields);
});
exports.listHealthFacilities = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { type } = (request.data ?? {});
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.listFacilities(request.auth.uid, type);
});
exports.createHealthcareProvider = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const fields = request.data;
    if (!fields?.name || !fields?.role)
        throw new https_1.HttpsError('invalid-argument', 'name and role required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.createHealthcareProvider(request.auth.uid, fields);
});
exports.listHealthcareProviders = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { role } = (request.data ?? {});
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.listHealthcareProviders(request.auth.uid, role);
});
// ── Appointments ──────────────────────────────────────────────────────────────
exports.scheduleAppointment = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const fields = request.data;
    if (!fields?.patientId || !fields?.scheduledFor)
        throw new https_1.HttpsError('invalid-argument', 'patientId and scheduledFor required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.scheduleAppointment(request.auth.uid, fields);
});
exports.rescheduleAppointment = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { appointmentId, newTime } = request.data;
    if (!appointmentId || !newTime)
        throw new https_1.HttpsError('invalid-argument', 'appointmentId and newTime required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    await engine.rescheduleAppointment(request.auth.uid, appointmentId, newTime);
    return { success: true };
});
exports.cancelAppointment = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { appointmentId } = request.data;
    if (!appointmentId)
        throw new https_1.HttpsError('invalid-argument', 'appointmentId required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    await engine.cancelAppointment(request.auth.uid, appointmentId);
    return { success: true };
});
exports.completeAppointment = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { appointmentId } = request.data;
    if (!appointmentId)
        throw new https_1.HttpsError('invalid-argument', 'appointmentId required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    await engine.completeAppointment(request.auth.uid, appointmentId);
    return { success: true };
});
exports.setAppointmentTravelTime = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { appointmentId, minutes } = request.data;
    if (!appointmentId || minutes === undefined)
        throw new https_1.HttpsError('invalid-argument', 'appointmentId and minutes required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    await engine.setAppointmentTravelTime(request.auth.uid, appointmentId, minutes);
    return { success: true };
});
exports.listAppointments = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const opts = (request.data ?? {});
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.listAppointments(request.auth.uid, opts);
});
exports.createRecurringAppointments = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { base, rule, occurrences } = request.data;
    if (!base?.patientId || !rule || !occurrences)
        throw new https_1.HttpsError('invalid-argument', 'base, rule, occurrences required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.createRecurringAppointments(request.auth.uid, base, rule, occurrences);
});
// ── Medications ───────────────────────────────────────────────────────────────
exports.addMedication = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const fields = request.data;
    if (!fields?.patientId || !fields?.name)
        throw new https_1.HttpsError('invalid-argument', 'patientId and name required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.addMedication(request.auth.uid, fields);
});
exports.updateMedicationStatus = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { medicationId, status } = request.data;
    if (!medicationId || !status)
        throw new https_1.HttpsError('invalid-argument', 'medicationId and status required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    await engine.updateMedicationStatus(request.auth.uid, medicationId, status);
    return { success: true };
});
exports.listMedications = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const opts = (request.data ?? {});
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.listMedications(request.auth.uid, opts);
});
exports.scheduleMedicationDose = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { medicationId, scheduledFor } = request.data;
    if (!medicationId || !scheduledFor)
        throw new https_1.HttpsError('invalid-argument', 'medicationId and scheduledFor required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.scheduleDose(request.auth.uid, medicationId, scheduledFor);
});
exports.recordMedicationDose = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { medicationId, doseId, status } = request.data;
    if (!medicationId || !doseId || !status)
        throw new https_1.HttpsError('invalid-argument', 'medicationId, doseId, status required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    await engine.recordDose(request.auth.uid, medicationId, doseId, status);
    return { success: true };
});
exports.setMedicationRefillDate = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { medicationId, refillDate } = request.data;
    if (!medicationId || !refillDate)
        throw new https_1.HttpsError('invalid-argument', 'medicationId and refillDate required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    await engine.setRefillDate(request.auth.uid, medicationId, refillDate);
    return { success: true };
});
// ── Vaccinations ──────────────────────────────────────────────────────────────
exports.scheduleVaccination = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const fields = request.data;
    if (!fields?.patientId || !fields?.vaccineName)
        throw new https_1.HttpsError('invalid-argument', 'patientId and vaccineName required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.scheduleVaccination(request.auth.uid, fields);
});
exports.markVaccinationCompleted = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { vaccinationId, facilityId } = request.data;
    if (!vaccinationId)
        throw new https_1.HttpsError('invalid-argument', 'vaccinationId required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    await engine.markVaccinationCompleted(request.auth.uid, vaccinationId, facilityId);
    return { success: true };
});
exports.listVaccinations = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const opts = (request.data ?? {});
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.listVaccinations(request.auth.uid, opts);
});
exports.vaccinationDueList = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { withinDays } = (request.data ?? {});
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.vaccinationDueList(request.auth.uid, withinDays ?? 14);
});
// ── Disease Knowledge & Programs ─────────────────────────────────────────────
exports.registerDisease = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const fields = request.data;
    if (!fields?.name)
        throw new https_1.HttpsError('invalid-argument', 'name required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.registerDisease(request.auth.uid, fields);
});
exports.listDiseases = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { programId } = (request.data ?? {});
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.listDiseases(request.auth.uid, programId);
});
exports.registerHealthProgram = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const program = request.data;
    if (!program?.id || !program?.name)
        throw new https_1.HttpsError('invalid-argument', 'id and name required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    await engine.registerProgram(request.auth.uid, program);
    return { success: true };
});
exports.listHealthPrograms = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.listPrograms(request.auth.uid);
});
// ── Clinical Decision Support ─────────────────────────────────────────────────
exports.generateDecisionSupport = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 120 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { patientId } = request.data;
    if (!patientId)
        throw new https_1.HttpsError('invalid-argument', 'patientId required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.generateDecisionSupport(request.auth.uid, patientId);
});
// ── Analytics ─────────────────────────────────────────────────────────────────
exports.getHealthStats = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.getStats(request.auth.uid);
});
// ── Reminders / Suggestions ───────────────────────────────────────────────────
exports.runHealthReminderChecks = (0, https_1.onCall)({ timeoutSeconds: 60 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.runReminderChecks(request.auth.uid);
});
exports.listHealthSuggestions = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.listPendingSuggestions(request.auth.uid);
});
exports.dismissHealthSuggestion = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { suggestionId } = request.data;
    if (!suggestionId)
        throw new https_1.HttpsError('invalid-argument', 'suggestionId required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    await engine.dismissSuggestion(request.auth.uid, suggestionId);
    return { success: true };
});
exports.generateFollowUpReminder = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { patientId, reason } = request.data;
    if (!patientId || !reason)
        throw new https_1.HttpsError('invalid-argument', 'patientId and reason required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    return engine.generateFollowUpReminder(request.auth.uid, patientId, reason);
});
// ── Document Intelligence Integration ────────────────────────────────────────
exports.linkMedicalReport = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { patientId, documentId, extractedSummary } = request.data;
    if (!patientId || !documentId)
        throw new https_1.HttpsError('invalid-argument', 'patientId and documentId required');
    const engine = (0, health_1.getHealthEngine)(request.auth.uid, db(), apiKey());
    await engine.linkMedicalReport(request.auth.uid, patientId, documentId, extractedSummary ?? '');
    return { success: true };
});
//# sourceMappingURL=healthApi.js.map