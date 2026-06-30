"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicationManager = void 0;
const uuid_1 = require("uuid");
const HealthEvents_1 = require("./HealthEvents");
const COL = (userId) => `users/${userId}/medications`;
class MedicationManager {
    constructor(db) {
        this.db = db;
    }
    async addMedication(userId, fields) {
        const now = new Date().toISOString();
        const med = {
            id: (0, uuid_1.v4)(),
            userId,
            status: 'active',
            doses: [],
            ...fields,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(COL(userId)).doc(med.id).set(med);
        void HealthEvents_1.HealthEvents.emit('medication:added', userId, { medicationId: med.id, patientId: med.patientId });
        return med;
    }
    async get(userId, medicationId) {
        const snap = await this.db.collection(COL(userId)).doc(medicationId).get();
        return snap.exists ? snap.data() : null;
    }
    async updateStatus(userId, medicationId, status) {
        await this.db.collection(COL(userId)).doc(medicationId).update({ status, updatedAt: new Date().toISOString() });
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
    // ── Dose Schedule ─────────────────────────────────────────────────────────
    async scheduleDose(userId, medicationId, scheduledFor) {
        const med = await this.get(userId, medicationId);
        if (!med)
            throw new Error('Medication not found');
        const dose = { id: (0, uuid_1.v4)(), scheduledFor, status: 'pending' };
        med.doses.push(dose);
        await this.db.collection(COL(userId)).doc(medicationId).update({ doses: med.doses, updatedAt: new Date().toISOString() });
        return dose;
    }
    async recordDose(userId, medicationId, doseId, status) {
        const med = await this.get(userId, medicationId);
        if (!med)
            throw new Error('Medication not found');
        const dose = med.doses.find((d) => d.id === doseId);
        if (!dose)
            throw new Error('Dose not found');
        dose.status = status;
        if (status === 'taken')
            dose.takenAt = new Date().toISOString();
        await this.db.collection(COL(userId)).doc(medicationId).update({ doses: med.doses, updatedAt: new Date().toISOString() });
        if (status === 'missed') {
            void HealthEvents_1.HealthEvents.emit('medication:dose_missed', userId, { medicationId, doseId, patientId: med.patientId });
        }
    }
    // ── Missed Dose Detection ────────────────────────────────────────────────
    async detectMissedDoses(userId) {
        const meds = await this.list(userId, { status: 'active' });
        const now = Date.now();
        const missed = [];
        for (const med of meds) {
            for (const dose of med.doses) {
                if (dose.status === 'pending' && new Date(dose.scheduledFor).getTime() < now - 30 * 60 * 1000) {
                    dose.status = 'missed';
                    missed.push({ medicationId: med.id, doseId: dose.id, patientId: med.patientId });
                }
            }
            if (missed.some((m) => m.medicationId === med.id)) {
                await this.db.collection(COL(userId)).doc(med.id).update({ doses: med.doses, updatedAt: new Date().toISOString() });
            }
        }
        for (const m of missed) {
            void HealthEvents_1.HealthEvents.emit('medication:dose_missed', userId, m);
        }
        return missed;
    }
    // ── Refill Reminder ───────────────────────────────────────────────────────
    async setRefillDate(userId, medicationId, refillDate) {
        await this.db.collection(COL(userId)).doc(medicationId).update({ refillDate, updatedAt: new Date().toISOString() });
    }
    async listRefillsDue(userId, withinDays) {
        const meds = await this.list(userId, { status: 'active' });
        const horizon = Date.now() + withinDays * 86400000;
        const due = meds.filter((m) => m.refillDate && new Date(m.refillDate).getTime() <= horizon);
        for (const m of due) {
            void HealthEvents_1.HealthEvents.emit('medication:refill_due', userId, { medicationId: m.id, patientId: m.patientId });
        }
        return due;
    }
    // ── Adherence ─────────────────────────────────────────────────────────────
    computeAdherenceRate(med) {
        const tracked = med.doses.filter((d) => d.status !== 'pending');
        if (tracked.length === 0)
            return 1;
        const taken = tracked.filter((d) => d.status === 'taken').length;
        return taken / tracked.length;
    }
    // ── Drug Interaction Placeholder ─────────────────────────────────────────
    // Real interaction checking requires an external knowledge base; this is a
    // pluggable extension point that programs/plugins can override.
    checkInteractionsPlaceholder(medications) {
        void medications;
        return [];
    }
}
exports.MedicationManager = MedicationManager;
//# sourceMappingURL=MedicationManager.js.map