"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaccinationManager = void 0;
const uuid_1 = require("uuid");
const HealthEvents_1 = require("./HealthEvents");
const COL = (userId) => `users/${userId}/vaccinations`;
class VaccinationManager {
    constructor(db) {
        this.db = db;
    }
    async schedule(userId, fields) {
        const now = new Date().toISOString();
        const vac = {
            id: (0, uuid_1.v4)(),
            userId,
            status: 'due',
            isBooster: fields.isBooster ?? false,
            ...fields,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(COL(userId)).doc(vac.id).set(vac);
        void HealthEvents_1.HealthEvents.emit('vaccination:scheduled', userId, { vaccinationId: vac.id, patientId: vac.patientId });
        return vac;
    }
    async get(userId, vaccinationId) {
        const snap = await this.db.collection(COL(userId)).doc(vaccinationId).get();
        return snap.exists ? snap.data() : null;
    }
    async markCompleted(userId, vaccinationId, facilityId) {
        const now = new Date().toISOString();
        await this.db.collection(COL(userId)).doc(vaccinationId).update({
            status: 'completed',
            administeredAt: now,
            facilityId,
            updatedAt: now,
        });
        const vac = await this.get(userId, vaccinationId);
        if (vac)
            void HealthEvents_1.HealthEvents.emit('vaccination:completed', userId, { vaccinationId, patientId: vac.patientId });
    }
    async markMissed(userId, vaccinationId) {
        await this.db.collection(COL(userId)).doc(vaccinationId).update({
            status: 'missed',
            updatedAt: new Date().toISOString(),
        });
        const vac = await this.get(userId, vaccinationId);
        if (vac)
            void HealthEvents_1.HealthEvents.emit('vaccination:missed', userId, { vaccinationId, patientId: vac.patientId });
    }
    async list(userId, opts = {}) {
        let query = this.db.collection(COL(userId));
        if (opts.patientId)
            query = query.where('patientId', '==', opts.patientId);
        if (opts.status)
            query = query.where('status', '==', opts.status);
        const snap = await query.get();
        return snap.docs.map((d) => d.data());
    }
    async dueList(userId, withinDays) {
        const all = await this.list(userId, { status: 'due' });
        const horizon = Date.now() + withinDays * 86400000;
        return all.filter((v) => new Date(v.scheduledFor).getTime() <= horizon);
    }
    async upcomingList(userId) {
        return this.list(userId, { status: 'upcoming' });
    }
    async completedList(userId, patientId) {
        return this.list(userId, { patientId, status: 'completed' });
    }
    async missedList(userId, patientId) {
        return this.list(userId, { patientId, status: 'missed' });
    }
    async scheduleBooster(userId, patientId, vaccineName, doseNumber, scheduledFor) {
        return this.schedule(userId, { patientId, vaccineName, doseNumber, scheduledFor, isBooster: true });
    }
    async refreshDueStatuses(userId, dueWindowDays) {
        const all = await this.list(userId);
        const now = Date.now();
        for (const v of all) {
            if (v.status !== 'due' && v.status !== 'upcoming')
                continue;
            const t = new Date(v.scheduledFor).getTime();
            const nextStatus = t < now ? 'missed' : t <= now + dueWindowDays * 86400000 ? 'due' : 'upcoming';
            if (nextStatus !== v.status) {
                await this.db.collection(COL(userId)).doc(v.id).update({ status: nextStatus, updatedAt: new Date().toISOString() });
            }
        }
    }
}
exports.VaccinationManager = VaccinationManager;
//# sourceMappingURL=VaccinationManager.js.map