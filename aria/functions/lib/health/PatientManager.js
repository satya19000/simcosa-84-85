"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientManager = void 0;
const uuid_1 = require("uuid");
const COL = (userId) => `users/${userId}/patients`;
class PatientManager {
    constructor(db) {
        this.db = db;
    }
    async createPatient(userId, demographics, tags) {
        const now = new Date().toISOString();
        const patient = {
            id: (0, uuid_1.v4)(),
            userId,
            demographics,
            visits: [],
            allergies: [],
            medicalHistory: [],
            labResults: [],
            documentIds: [],
            tags,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(COL(userId)).doc(patient.id).set(patient);
        return patient;
    }
    async getPatient(userId, patientId) {
        const snap = await this.db.collection(COL(userId)).doc(patientId).get();
        return snap.exists ? snap.data() : null;
    }
    async updatePatient(userId, patientId, patch) {
        await this.db.collection(COL(userId)).doc(patientId).update({
            ...patch,
            updatedAt: new Date().toISOString(),
        });
    }
    async deletePatient(userId, patientId) {
        await this.db.collection(COL(userId)).doc(patientId).delete();
    }
    async listPatients(userId, limit = 100) {
        const snap = await this.db.collection(COL(userId))
            .orderBy('updatedAt', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map((d) => d.data());
    }
    async addVisit(userId, patientId, visit) {
        const patient = await this.getPatient(userId, patientId);
        if (!patient)
            throw new Error('Patient not found');
        const newVisit = { id: (0, uuid_1.v4)(), ...visit };
        patient.visits.push(newVisit);
        await this.updatePatient(userId, patientId, { visits: patient.visits });
        return newVisit;
    }
    async addAllergy(userId, patientId, allergy) {
        const patient = await this.getPatient(userId, patientId);
        if (!patient)
            throw new Error('Patient not found');
        const newAllergy = { id: (0, uuid_1.v4)(), ...allergy };
        patient.allergies.push(newAllergy);
        await this.updatePatient(userId, patientId, { allergies: patient.allergies });
        return newAllergy;
    }
    async addMedicalHistory(userId, patientId, entry) {
        const patient = await this.getPatient(userId, patientId);
        if (!patient)
            throw new Error('Patient not found');
        const newEntry = { id: (0, uuid_1.v4)(), ...entry };
        patient.medicalHistory.push(newEntry);
        await this.updatePatient(userId, patientId, { medicalHistory: patient.medicalHistory });
        return newEntry;
    }
    async addLabResult(userId, patientId, result) {
        const patient = await this.getPatient(userId, patientId);
        if (!patient)
            throw new Error('Patient not found');
        const newResult = { id: (0, uuid_1.v4)(), ...result };
        patient.labResults.push(newResult);
        await this.updatePatient(userId, patientId, { labResults: patient.labResults });
        return newResult;
    }
    async linkDocument(userId, patientId, documentId) {
        const patient = await this.getPatient(userId, patientId);
        if (!patient)
            throw new Error('Patient not found');
        if (!patient.documentIds.includes(documentId)) {
            patient.documentIds.push(documentId);
            await this.updatePatient(userId, patientId, { documentIds: patient.documentIds });
        }
    }
    async setMemoryNodeId(userId, patientId, memoryNodeId) {
        await this.updatePatient(userId, patientId, { memoryNodeId });
    }
}
exports.PatientManager = PatientManager;
//# sourceMappingURL=PatientManager.js.map