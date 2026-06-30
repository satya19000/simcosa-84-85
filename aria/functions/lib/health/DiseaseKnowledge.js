"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiseaseKnowledge = void 0;
const uuid_1 = require("uuid");
const DISEASES_COL = (userId) => `users/${userId}/diseaseKnowledge`;
const PROGRAMS_COL = (userId) => `users/${userId}/healthPrograms`;
// ── Disease & Program Knowledge Store ────────────────────────────────────────
// Provider-independent. Public-health plugins (Maternal Health, TB, HIV, NCD,
// Immunization, etc) register diseases/protocols/programs here without the
// core engine depending on any specific program.
class DiseaseKnowledge {
    constructor(db) {
        this.db = db;
    }
    async registerDisease(userId, fields) {
        const now = new Date().toISOString();
        const disease = { id: (0, uuid_1.v4)(), ...fields, createdAt: now, updatedAt: now };
        await this.db.collection(DISEASES_COL(userId)).doc(disease.id).set(disease);
        return disease;
    }
    async getDisease(userId, diseaseId) {
        const snap = await this.db.collection(DISEASES_COL(userId)).doc(diseaseId).get();
        return snap.exists ? snap.data() : null;
    }
    async updateDisease(userId, diseaseId, patch) {
        await this.db.collection(DISEASES_COL(userId)).doc(diseaseId).update({
            ...patch,
            updatedAt: new Date().toISOString(),
        });
    }
    async listDiseases(userId, programId) {
        let query = this.db.collection(DISEASES_COL(userId));
        if (programId)
            query = query.where('programId', '==', programId);
        const snap = await query.get();
        return snap.docs.map((d) => d.data());
    }
    async searchDiseases(userId, queryText) {
        const all = await this.listDiseases(userId);
        const lower = queryText.toLowerCase();
        return all.filter((d) => d.name.toLowerCase().includes(lower) ||
            d.symptoms.some((s) => s.toLowerCase().includes(lower)));
    }
    // ── Programs ──────────────────────────────────────────────────────────────
    async registerProgram(userId, program) {
        await this.db.collection(PROGRAMS_COL(userId)).doc(program.id).set(program);
    }
    async listPrograms(userId) {
        const snap = await this.db.collection(PROGRAMS_COL(userId)).get();
        return snap.docs.map((d) => d.data());
    }
    async getProgram(userId, programId) {
        const snap = await this.db.collection(PROGRAMS_COL(userId)).doc(programId).get();
        return snap.exists ? snap.data() : null;
    }
}
exports.DiseaseKnowledge = DiseaseKnowledge;
//# sourceMappingURL=DiseaseKnowledge.js.map