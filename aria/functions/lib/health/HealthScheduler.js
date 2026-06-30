"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthScheduler = void 0;
const uuid_1 = require("uuid");
const HealthEvents_1 = require("./HealthEvents");
const SUGGESTIONS_COL = (userId) => `users/${userId}/healthSuggestions`;
// ── Health Scheduler ──────────────────────────────────────────────────────────
// Generates suggestions only — appointment reminders, medication reminders,
// follow-up reminders, refill reminders, vaccination-due notices, health
// education messages. NEVER sends anything automatically; every suggestion
// requires explicit user approval before the Communication Hub dispatches it.
class HealthScheduler {
    constructor(db, appointments, medications, vaccinations, reminderLeadMinutes, refillReminderLeadDays, vaccinationDueWindowDays) {
        this.db = db;
        this.appointments = appointments;
        this.medications = medications;
        this.vaccinations = vaccinations;
        this.reminderLeadMinutes = reminderLeadMinutes;
        this.refillReminderLeadDays = refillReminderLeadDays;
        this.vaccinationDueWindowDays = vaccinationDueWindowDays;
    }
    async createSuggestion(userId, patientId, type, title, description) {
        const suggestion = {
            id: (0, uuid_1.v4)(),
            patientId,
            type,
            title,
            description,
            requiresApproval: true,
            createdAt: new Date().toISOString(),
        };
        await this.db.collection(SUGGESTIONS_COL(userId)).doc(suggestion.id).set(suggestion);
        void HealthEvents_1.HealthEvents.emit('reminder:suggested', userId, { suggestionId: suggestion.id, type, patientId });
        return suggestion;
    }
    async generateAppointmentReminders(userId) {
        const upcoming = await this.appointments.listUpcoming(userId, this.reminderLeadMinutes / 60);
        const suggestions = [];
        for (const appt of upcoming) {
            if (appt.reminderScheduled)
                continue;
            suggestions.push(await this.createSuggestion(userId, appt.patientId, 'appointment_reminder', 'Appointment Reminder', `Upcoming appointment scheduled for ${appt.scheduledFor}.`));
            await this.appointments.markReminderScheduled(userId, appt.id);
        }
        return suggestions;
    }
    async generateMedicationReminders(userId) {
        const missed = await this.medications.detectMissedDoses(userId);
        const suggestions = [];
        for (const m of missed) {
            suggestions.push(await this.createSuggestion(userId, m.patientId, 'medication_reminder', 'Missed Dose', `A scheduled medication dose was missed (medication ${m.medicationId}).`));
        }
        return suggestions;
    }
    async generateRefillReminders(userId) {
        const due = await this.medications.listRefillsDue(userId, this.refillReminderLeadDays);
        const suggestions = [];
        for (const med of due) {
            suggestions.push(await this.createSuggestion(userId, med.patientId, 'refill_reminder', 'Refill Due', `Medication "${med.name}" refill is due soon.`));
        }
        return suggestions;
    }
    async generateVaccinationDueReminders(userId) {
        const due = await this.vaccinations.dueList(userId, this.vaccinationDueWindowDays);
        const suggestions = [];
        for (const vac of due) {
            suggestions.push(await this.createSuggestion(userId, vac.patientId, 'vaccination_due', 'Vaccination Due', `${vac.vaccineName} (dose ${vac.doseNumber}) is due on ${vac.scheduledFor}.`));
        }
        return suggestions;
    }
    async generateFollowUpReminder(userId, patientId, reason) {
        return this.createSuggestion(userId, patientId, 'follow_up_reminder', 'Follow-up Needed', reason);
    }
    async generateHealthEducationMessage(userId, patientId, topic) {
        return this.createSuggestion(userId, patientId, 'health_education_message', 'Health Education', `Suggested health education message about: ${topic}.`);
    }
    async listPendingSuggestions(userId) {
        const snap = await this.db.collection(SUGGESTIONS_COL(userId)).orderBy('createdAt', 'desc').limit(100).get();
        return snap.docs.map((d) => d.data());
    }
    async dismissSuggestion(userId, suggestionId) {
        await this.db.collection(SUGGESTIONS_COL(userId)).doc(suggestionId).delete();
    }
    async runAllChecks(userId) {
        const results = await Promise.all([
            this.generateAppointmentReminders(userId),
            this.generateMedicationReminders(userId),
            this.generateRefillReminders(userId),
            this.generateVaccinationDueReminders(userId),
        ]);
        return { generated: results.reduce((sum, r) => sum + r.length, 0) };
    }
}
exports.HealthScheduler = HealthScheduler;
//# sourceMappingURL=HealthScheduler.js.map