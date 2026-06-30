import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { Vaccination, VaccinationStatus } from './HealthTypes'
import { HealthEvents } from './HealthEvents'

const COL = (userId: string) => `users/${userId}/vaccinations`

export class VaccinationManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async schedule(userId: string, fields: Omit<Vaccination, 'id' | 'userId' | 'status' | 'isBooster' | 'createdAt' | 'updatedAt'> & { isBooster?: boolean }): Promise<Vaccination> {
    const now = new Date().toISOString()
    const vac: Vaccination = {
      id: uuidv4(),
      userId,
      status: 'due',
      isBooster: fields.isBooster ?? false,
      ...fields,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(COL(userId)).doc(vac.id).set(vac)
    void HealthEvents.emit('vaccination:scheduled', userId, { vaccinationId: vac.id, patientId: vac.patientId })
    return vac
  }

  async get(userId: string, vaccinationId: string): Promise<Vaccination | null> {
    const snap = await this.db.collection(COL(userId)).doc(vaccinationId).get()
    return snap.exists ? (snap.data() as Vaccination) : null
  }

  async markCompleted(userId: string, vaccinationId: string, facilityId?: string): Promise<void> {
    const now = new Date().toISOString()
    await this.db.collection(COL(userId)).doc(vaccinationId).update({
      status: 'completed' as VaccinationStatus,
      administeredAt: now,
      facilityId,
      updatedAt: now,
    })
    const vac = await this.get(userId, vaccinationId)
    if (vac) void HealthEvents.emit('vaccination:completed', userId, { vaccinationId, patientId: vac.patientId })
  }

  async markMissed(userId: string, vaccinationId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(vaccinationId).update({
      status: 'missed' as VaccinationStatus,
      updatedAt: new Date().toISOString(),
    })
    const vac = await this.get(userId, vaccinationId)
    if (vac) void HealthEvents.emit('vaccination:missed', userId, { vaccinationId, patientId: vac.patientId })
  }

  async list(userId: string, opts: { patientId?: string; status?: VaccinationStatus } = {}): Promise<Vaccination[]> {
    let query: admin.firestore.Query = this.db.collection(COL(userId))
    if (opts.patientId) query = query.where('patientId', '==', opts.patientId)
    if (opts.status) query = query.where('status', '==', opts.status)
    const snap = await query.get()
    return snap.docs.map((d) => d.data() as Vaccination)
  }

  async dueList(userId: string, withinDays: number): Promise<Vaccination[]> {
    const all = await this.list(userId, { status: 'due' })
    const horizon = Date.now() + withinDays * 86_400_000
    return all.filter((v) => new Date(v.scheduledFor).getTime() <= horizon)
  }

  async upcomingList(userId: string): Promise<Vaccination[]> {
    return this.list(userId, { status: 'upcoming' })
  }

  async completedList(userId: string, patientId?: string): Promise<Vaccination[]> {
    return this.list(userId, { patientId, status: 'completed' })
  }

  async missedList(userId: string, patientId?: string): Promise<Vaccination[]> {
    return this.list(userId, { patientId, status: 'missed' })
  }

  async scheduleBooster(userId: string, patientId: string, vaccineName: string, doseNumber: number, scheduledFor: string): Promise<Vaccination> {
    return this.schedule(userId, { patientId, vaccineName, doseNumber, scheduledFor, isBooster: true })
  }

  async refreshDueStatuses(userId: string, dueWindowDays: number): Promise<void> {
    const all = await this.list(userId)
    const now = Date.now()
    for (const v of all) {
      if (v.status !== 'due' && v.status !== 'upcoming') continue
      const t = new Date(v.scheduledFor).getTime()
      const nextStatus: VaccinationStatus = t < now ? 'missed' : t <= now + dueWindowDays * 86_400_000 ? 'due' : 'upcoming'
      if (nextStatus !== v.status) {
        await this.db.collection(COL(userId)).doc(v.id).update({ status: nextStatus, updatedAt: new Date().toISOString() })
      }
    }
  }
}
