import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { Medication, MedicationDose, MedicationStatus, DoseStatus } from './HealthTypes'
import { HealthEvents } from './HealthEvents'

const COL = (userId: string) => `users/${userId}/medications`

export class MedicationManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async addMedication(userId: string, fields: Omit<Medication, 'id' | 'userId' | 'status' | 'doses' | 'createdAt' | 'updatedAt'>): Promise<Medication> {
    const now = new Date().toISOString()
    const med: Medication = {
      id: uuidv4(),
      userId,
      status: 'active',
      doses: [],
      ...fields,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(COL(userId)).doc(med.id).set(med)
    void HealthEvents.emit('medication:added', userId, { medicationId: med.id, patientId: med.patientId })
    return med
  }

  async get(userId: string, medicationId: string): Promise<Medication | null> {
    const snap = await this.db.collection(COL(userId)).doc(medicationId).get()
    return snap.exists ? (snap.data() as Medication) : null
  }

  async updateStatus(userId: string, medicationId: string, status: MedicationStatus): Promise<void> {
    await this.db.collection(COL(userId)).doc(medicationId).update({ status, updatedAt: new Date().toISOString() })
  }

  async list(userId: string, opts: { patientId?: string; status?: MedicationStatus } = {}): Promise<Medication[]> {
    let query: admin.firestore.Query = this.db.collection(COL(userId))
    if (opts.patientId) query = query.where('patientId', '==', opts.patientId)
    if (opts.status) query = query.where('status', '==', opts.status)
    const snap = await query.get()
    return snap.docs.map((d) => d.data() as Medication)
  }

  // ── Dose Schedule ─────────────────────────────────────────────────────────

  async scheduleDose(userId: string, medicationId: string, scheduledFor: string): Promise<MedicationDose> {
    const med = await this.get(userId, medicationId)
    if (!med) throw new Error('Medication not found')
    const dose: MedicationDose = { id: uuidv4(), scheduledFor, status: 'pending' }
    med.doses.push(dose)
    await this.db.collection(COL(userId)).doc(medicationId).update({ doses: med.doses, updatedAt: new Date().toISOString() })
    return dose
  }

  async recordDose(userId: string, medicationId: string, doseId: string, status: DoseStatus): Promise<void> {
    const med = await this.get(userId, medicationId)
    if (!med) throw new Error('Medication not found')
    const dose = med.doses.find((d) => d.id === doseId)
    if (!dose) throw new Error('Dose not found')
    dose.status = status
    if (status === 'taken') dose.takenAt = new Date().toISOString()
    await this.db.collection(COL(userId)).doc(medicationId).update({ doses: med.doses, updatedAt: new Date().toISOString() })
    if (status === 'missed') {
      void HealthEvents.emit('medication:dose_missed', userId, { medicationId, doseId, patientId: med.patientId })
    }
  }

  // ── Missed Dose Detection ────────────────────────────────────────────────

  async detectMissedDoses(userId: string): Promise<Array<{ medicationId: string; doseId: string; patientId: string }>> {
    const meds = await this.list(userId, { status: 'active' })
    const now = Date.now()
    const missed: Array<{ medicationId: string; doseId: string; patientId: string }> = []
    for (const med of meds) {
      for (const dose of med.doses) {
        if (dose.status === 'pending' && new Date(dose.scheduledFor).getTime() < now - 30 * 60 * 1000) {
          dose.status = 'missed'
          missed.push({ medicationId: med.id, doseId: dose.id, patientId: med.patientId })
        }
      }
      if (missed.some((m) => m.medicationId === med.id)) {
        await this.db.collection(COL(userId)).doc(med.id).update({ doses: med.doses, updatedAt: new Date().toISOString() })
      }
    }
    for (const m of missed) {
      void HealthEvents.emit('medication:dose_missed', userId, m)
    }
    return missed
  }

  // ── Refill Reminder ───────────────────────────────────────────────────────

  async setRefillDate(userId: string, medicationId: string, refillDate: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(medicationId).update({ refillDate, updatedAt: new Date().toISOString() })
  }

  async listRefillsDue(userId: string, withinDays: number): Promise<Medication[]> {
    const meds = await this.list(userId, { status: 'active' })
    const horizon = Date.now() + withinDays * 86_400_000
    const due = meds.filter((m) => m.refillDate && new Date(m.refillDate).getTime() <= horizon)
    for (const m of due) {
      void HealthEvents.emit('medication:refill_due', userId, { medicationId: m.id, patientId: m.patientId })
    }
    return due
  }

  // ── Adherence ─────────────────────────────────────────────────────────────

  computeAdherenceRate(med: Medication): number {
    const tracked = med.doses.filter((d) => d.status !== 'pending')
    if (tracked.length === 0) return 1
    const taken = tracked.filter((d) => d.status === 'taken').length
    return taken / tracked.length
  }

  // ── Drug Interaction Placeholder ─────────────────────────────────────────
  // Real interaction checking requires an external knowledge base; this is a
  // pluggable extension point that programs/plugins can override.

  checkInteractionsPlaceholder(medications: Medication[]): string[] {
    void medications
    return []
  }
}
