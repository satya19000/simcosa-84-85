import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { Appointment, AppointmentStatus, RecurrenceRule } from './HealthTypes'
import { HealthEvents } from './HealthEvents'

const COL = (userId: string) => `users/${userId}/healthAppointments`

export class AppointmentManager {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async schedule(userId: string, fields: Omit<Appointment, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const now = new Date().toISOString()
    const appt: Appointment = {
      id: uuidv4(),
      userId,
      status: 'scheduled',
      ...fields,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(COL(userId)).doc(appt.id).set(appt)
    void HealthEvents.emit('appointment:scheduled', userId, { appointmentId: appt.id, patientId: appt.patientId })
    return appt
  }

  async get(userId: string, appointmentId: string): Promise<Appointment | null> {
    const snap = await this.db.collection(COL(userId)).doc(appointmentId).get()
    return snap.exists ? (snap.data() as Appointment) : null
  }

  async reschedule(userId: string, appointmentId: string, newTime: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(appointmentId).update({
      scheduledFor: newTime,
      status: 'rescheduled' as AppointmentStatus,
      updatedAt: new Date().toISOString(),
    })
    void HealthEvents.emit('appointment:rescheduled', userId, { appointmentId, newTime })
  }

  async cancel(userId: string, appointmentId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(appointmentId).update({
      status: 'cancelled' as AppointmentStatus,
      updatedAt: new Date().toISOString(),
    })
    void HealthEvents.emit('appointment:cancelled', userId, { appointmentId })
  }

  async complete(userId: string, appointmentId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(appointmentId).update({
      status: 'completed' as AppointmentStatus,
      updatedAt: new Date().toISOString(),
    })
    void HealthEvents.emit('appointment:completed', userId, { appointmentId })
  }

  async setTravelTime(userId: string, appointmentId: string, minutes: number): Promise<void> {
    await this.db.collection(COL(userId)).doc(appointmentId).update({
      travelTimeMinutes: minutes,
      updatedAt: new Date().toISOString(),
    })
  }

  async markReminderScheduled(userId: string, appointmentId: string): Promise<void> {
    await this.db.collection(COL(userId)).doc(appointmentId).update({
      reminderScheduled: true,
      updatedAt: new Date().toISOString(),
    })
  }

  async list(userId: string, opts: { patientId?: string; status?: AppointmentStatus; limit?: number } = {}): Promise<Appointment[]> {
    let query: admin.firestore.Query = this.db.collection(COL(userId))
    if (opts.patientId) query = query.where('patientId', '==', opts.patientId)
    if (opts.status) query = query.where('status', '==', opts.status)
    query = query.orderBy('scheduledFor', 'asc').limit(opts.limit ?? 100)
    const snap = await query.get()
    return snap.docs.map((d) => d.data() as Appointment)
  }

  async listUpcoming(userId: string, withinHours = 24): Promise<Appointment[]> {
    const now = new Date()
    const horizon = new Date(now.getTime() + withinHours * 60 * 60 * 1000)
    const all = await this.list(userId, { status: 'scheduled', limit: 200 })
    return all.filter((a) => {
      const t = new Date(a.scheduledFor)
      return t >= now && t <= horizon
    })
  }

  async createRecurringSeries(
    userId: string,
    base: Omit<Appointment, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt' | 'recurrence'>,
    rule: RecurrenceRule,
    occurrences: number
  ): Promise<Appointment[]> {
    const created: Appointment[] = []
    const stepMs = rule === 'daily' ? 86_400_000 : rule === 'weekly' ? 7 * 86_400_000 : rule === 'monthly' ? 30 * 86_400_000 : 0
    for (let i = 0; i < occurrences; i++) {
      const scheduledFor = new Date(new Date(base.scheduledFor).getTime() + i * stepMs).toISOString()
      const appt = await this.schedule(userId, { ...base, scheduledFor, recurrence: rule })
      created.push(appt)
    }
    return created
  }
}
