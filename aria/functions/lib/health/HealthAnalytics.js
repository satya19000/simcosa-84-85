"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthAnalytics = void 0;
const PATIENTS_COL = (userId) => `users/${userId}/patients`;
const APPOINTMENTS_COL = (userId) => `users/${userId}/healthAppointments`;
const MEDICATIONS_COL = (userId) => `users/${userId}/medications`;
const VACCINATIONS_COL = (userId) => `users/${userId}/vaccinations`;
const FACILITIES_COL = (userId) => `users/${userId}/healthFacilities`;
class HealthAnalytics {
    constructor(db) {
        this.db = db;
    }
    async getStats(userId) {
        const [patientsSnap, apptsSnap, medsSnap, vacsSnap, facilitiesSnap] = await Promise.all([
            this.db.collection(PATIENTS_COL(userId)).get(),
            this.db.collection(APPOINTMENTS_COL(userId)).get(),
            this.db.collection(MEDICATIONS_COL(userId)).get(),
            this.db.collection(VACCINATIONS_COL(userId)).get(),
            this.db.collection(FACILITIES_COL(userId)).get(),
        ]);
        const now = Date.now();
        const appointments = apptsSnap.docs.map((d) => d.data());
        const upcomingAppointments = appointments.filter((a) => a.status === 'scheduled' && new Date(a.scheduledFor).getTime() > now).length;
        const pendingFollowUps = appointments.filter((a) => a.status === 'missed').length;
        const medications = medsSnap.docs.map((d) => d.data());
        const adherenceRates = medications.map((m) => {
            const tracked = m.doses.filter((d) => d.status !== 'pending');
            if (tracked.length === 0)
                return null;
            return tracked.filter((d) => d.status === 'taken').length / tracked.length;
        }).filter((r) => r !== null);
        const medicationAdherenceRate = adherenceRates.length > 0
            ? adherenceRates.reduce((a, b) => a + b, 0) / adherenceRates.length
            : 1;
        const vaccinations = vacsSnap.docs.map((d) => d.data());
        const vaccinationCoverage = vaccinations.length > 0
            ? vaccinations.filter((v) => v.status === 'completed').length / vaccinations.length
            : 0;
        const facilities = facilitiesSnap.docs.map((d) => d.data());
        const byFacilityType = {};
        for (const f of facilities)
            byFacilityType[f.type] = (byFacilityType[f.type] ?? 0) + 1;
        return {
            totalPatients: patientsSnap.size,
            totalAppointments: apptsSnap.size,
            upcomingAppointments,
            medicationAdherenceRate,
            vaccinationCoverage,
            pendingFollowUps,
            facilitiesCount: facilitiesSnap.size,
            byFacilityType,
        };
    }
    async getProgramCoverage(userId, programDiseaseIds) {
        if (programDiseaseIds.length === 0)
            return { programCount: 0, affectedPatients: 0 };
        const snap = await this.db.collection(PATIENTS_COL(userId)).get();
        let affected = 0;
        for (const doc of snap.docs) {
            const patient = doc.data();
            const hasCondition = (patient.medicalHistory ?? []).some((h) => programDiseaseIds.includes(h.condition));
            if (hasCondition)
                affected++;
        }
        return { programCount: programDiseaseIds.length, affectedPatients: affected };
    }
}
exports.HealthAnalytics = HealthAnalytics;
//# sourceMappingURL=HealthAnalytics.js.map