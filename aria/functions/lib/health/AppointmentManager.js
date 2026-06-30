"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentManager = void 0;
const uuid_1 = require("uuid");
const HealthEvents_1 = require("./HealthEvents");
const COL = (userId) => `users/${userId}/healthAppointments`;
class AppointmentManager {
    constructor(db) {
        this.db = db;
    }
    async schedule(userId, fields) {
        const now = new Date().toISOString();
        const appt = {
            id: (0, uuid_1.v4)(),
            userId,
            status: 'scheduled',
            ...fields,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(COL(userId)).doc(appt.id).set(appt);
        void HealthEvents_1.HealthEvents.emit('appointment:scheduled', userId, { appointmentId: appt.id, patientId: appt.patientId });
        return appt;
    }
    async get(userId, appointmentId) {
        const snap = await this.db.collection(COL(userId)).doc(appointmentId).get();
        return snap.exists ? snap.data() : null;
    }
    async reschedule(userId, appointmentId, newTime) {
        await this.db.collection(COL(userId)).doc(appointmentId).update({
            scheduledFor: newTime,
            status: 'rescheduled',
            updatedAt: new Date().toISOString(),
        });
        void HealthEvents_1.HealthEvents.emit('appointment:rescheduled', userId, { appointmentId, newTime });
    }
    async cancel(userId, appointmentId) {
        await this.db.collection(COL(userId)).doc(appointmentId).update({
            status: 'cancelled',
            updatedAt: new Date().toISOString(),
        });
        void HealthEvents_1.HealthEvents.emit('appointment:cancelled', userId, { appointmentId });
    }
    async complete(userId, appointmentId) {
        await this.db.collection(COL(userId)).doc(appointmentId).update({
            status: 'completed',
            updatedAt: new Date().toISOString(),
        });
        void HealthEvents_1.HealthEvents.emit('appointment:completed', userId, { appointmentId });
    }
    async setTravelTime(userId, appointmentId, minutes) {
        await this.db.collection(COL(userId)).doc(appointmentId).update({
            travelTimeMinutes: minutes,
            updatedAt: new Date().toISOString(),
        });
    }
    async markReminderScheduled(userId, appointmentId) {
        await this.db.collection(COL(userId)).doc(appointmentId).update({
            reminderScheduled: true,
            updatedAt: new Date().toISOString(),
        });
    }
    async list(userId, opts = {}) {
        let query = this.db.collection(COL(userId));
        if (opts.patientId)
            query = query.where('patientId', '==', opts.patientId);
        if (opts.status)
            query = query.where('status', '==', opts.status);
        query = query.orderBy('scheduledFor', 'asc').limit(opts.limit ?? 100);
        const snap = await query.get();
        return snap.docs.map((d) => d.data());
    }
    async listUpcoming(userId, withinHours = 24) {
        const now = new Date();
        const horizon = new Date(now.getTime() + withinHours * 60 * 60 * 1000);
        const all = await this.list(userId, { status: 'scheduled', limit: 200 });
        return all.filter((a) => {
            const t = new Date(a.scheduledFor);
            return t >= now && t <= horizon;
        });
    }
    async createRecurringSeries(userId, base, rule, occurrences) {
        const created = [];
        const stepMs = rule === 'daily' ? 86400000 : rule === 'weekly' ? 7 * 86400000 : rule === 'monthly' ? 30 * 86400000 : 0;
        for (let i = 0; i < occurrences; i++) {
            const scheduledFor = new Date(new Date(base.scheduledFor).getTime() + i * stepMs).toISOString();
            const appt = await this.schedule(userId, { ...base, scheduledFor, recurrence: rule });
            created.push(appt);
        }
        return created;
    }
}
exports.AppointmentManager = AppointmentManager;
//# sourceMappingURL=AppointmentManager.js.map