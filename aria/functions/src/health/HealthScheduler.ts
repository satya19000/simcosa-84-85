import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { HealthSuggestion, HealthSuggestionType } from './HealthTypes'
import { AppointmentManager } from './AppointmentManager'
import { MedicationManager } from './MedicationManager'
import { VaccinationManager } from './VaccinationManager'
import { HealthEvents } from './HealthEvents'

const SUGGESTIONS_COL = (userId: string) => `users/${userId}/healthSuggestions`

// ── Health Scheduler ──────────────────────────────────────────────────────────
// Generates suggestions only — appointment reminders, medication reminders,
// follow-up reminders, refill reminders, vaccination-due notices, health
// education messages. NEVER sends anything automatically; every suggestion
// requires explicit user approval before the Communication Hub dispatches it.

export class HealthScheduler {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly appointments: AppointmentManager,
    private readonly medications: MedicationManager,
    private readonly vaccinations: VaccinationManager,
    private readonly reminderLeadMinutes: number,
    private readonly refillReminderLeadDays: number,
    private readonly vaccinationDueWindowDays: number
  ) {}

  private async createSuggestion(
    userId: string,
    patientId: string,
    type: HealthSuggestionType,
    title: string,
    description: string
  ): Promise<HealthSuggestion> {
    const suggestion: HealthSuggestion = {
      id: uuidv4(),
      patientId,
      type,
      title,
      description,
      requiresApproval: true,
      createdAt: new Date().toISOString(),
    }
    await this.db.collection(SUGGESTIONS_COL(userId)).doc(suggestion.id).set(suggestion)
    void HealthEvents.emit('reminder:suggested', userId, { suggestionId: suggestion.id, type, patientId })
    return suggestion
  }

  async generateAppointmentReminders(userId: string): Promise<HealthSuggestion[]> {
    const upcoming = await this.appointments.listUpcoming(userId, this.reminderLeadMinutes / 60)
    const suggestions: HealthSuggestion[] = []
    for (const appt of upcoming) {
      if (appt.reminderScheduled) continue
      suggestions.push(
        await this.createSuggestion(
          userId,
          appt.patientId,
          'appointment_reminder',
          'Appointment Reminder',
          `Upcoming appointment scheduled for ${appt.scheduledFor}.`
        )
      )
      await this.appointments.markReminderScheduled(userId, appt.id)
    }
    return suggestions
  }

  async generateMedicationReminders(userId: string): Promise<HealthSuggestion[]> {
    const missed = await this.medications.detectMissedDoses(userId)
    const suggestions: HealthSuggestion[] = []
    for (const m of missed) {
      suggestions.push(
        await this.createSuggestion(
          userId,
          m.patientId,
          'medication_reminder',
          'Missed Dose',
          `A scheduled medication dose was missed (medication ${m.medicationId}).`
        )
      )
    }
    return suggestions
  }

  async generateRefillReminders(userId: string): Promise<HealthSuggestion[]> {
    const due = await this.medications.listRefillsDue(userId, this.refillReminderLeadDays)
    const suggestions: HealthSuggestion[] = []
    for (const med of due) {
      suggestions.push(
        await this.createSuggestion(
          userId,
          med.patientId,
          'refill_reminder',
          'Refill Due',
          `Medication "${med.name}" refill is due soon.`
        )
      )
    }
    return suggestions
  }

  async generateVaccinationDueReminders(userId: string): Promise<HealthSuggestion[]> {
    const due = await this.vaccinations.dueList(userId, this.vaccinationDueWindowDays)
    const suggestions: HealthSuggestion[] = []
    for (const vac of due) {
      suggestions.push(
        await this.createSuggestion(
          userId,
          vac.patientId,
          'vaccination_due',
          'Vaccination Due',
          `${vac.vaccineName} (dose ${vac.doseNumber}) is due on ${vac.scheduledFor}.`
        )
      )
    }
    return suggestions
  }

  async generateFollowUpReminder(userId: string, patientId: string, reason: string): Promise<HealthSuggestion> {
    return this.createSuggestion(userId, patientId, 'follow_up_reminder', 'Follow-up Needed', reason)
  }

  async generateHealthEducationMessage(userId: string, patientId: string, topic: string): Promise<HealthSuggestion> {
    return this.createSuggestion(
      userId,
      patientId,
      'health_education_message',
      'Health Education',
      `Suggested health education message about: ${topic}.`
    )
  }

  async listPendingSuggestions(userId: string): Promise<HealthSuggestion[]> {
    const snap = await this.db.collection(SUGGESTIONS_COL(userId)).orderBy('createdAt', 'desc').limit(100).get()
    return snap.docs.map((d) => d.data() as HealthSuggestion)
  }

  async dismissSuggestion(userId: string, suggestionId: string): Promise<void> {
    await this.db.collection(SUGGESTIONS_COL(userId)).doc(suggestionId).delete()
  }

  async runAllChecks(userId: string): Promise<{ generated: number }> {
    const results = await Promise.all([
      this.generateAppointmentReminders(userId),
      this.generateMedicationReminders(userId),
      this.generateRefillReminders(userId),
      this.generateVaccinationDueReminders(userId),
    ])
    return { generated: results.reduce((sum, r) => sum + r.length, 0) }
  }
}
