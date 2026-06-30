"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacilityManager = void 0;
const uuid_1 = require("uuid");
const FACILITIES_COL = (userId) => `users/${userId}/healthFacilities`;
const PROVIDERS_COL = (userId) => `users/${userId}/healthcareProviders`;
class FacilityManager {
    constructor(db) {
        this.db = db;
    }
    // ── Facilities ────────────────────────────────────────────────────────────
    async createFacility(userId, fields) {
        const now = new Date().toISOString();
        const facility = { id: (0, uuid_1.v4)(), userId, ...fields, createdAt: now, updatedAt: now };
        await this.db.collection(FACILITIES_COL(userId)).doc(facility.id).set(facility);
        return facility;
    }
    async getFacility(userId, facilityId) {
        const snap = await this.db.collection(FACILITIES_COL(userId)).doc(facilityId).get();
        return snap.exists ? snap.data() : null;
    }
    async updateFacility(userId, facilityId, patch) {
        await this.db.collection(FACILITIES_COL(userId)).doc(facilityId).update({
            ...patch,
            updatedAt: new Date().toISOString(),
        });
    }
    async deleteFacility(userId, facilityId) {
        await this.db.collection(FACILITIES_COL(userId)).doc(facilityId).delete();
    }
    async listFacilities(userId, type) {
        let query = this.db.collection(FACILITIES_COL(userId));
        if (type)
            query = query.where('type', '==', type);
        const snap = await query.get();
        return snap.docs.map((d) => d.data());
    }
    async setMemoryNodeId(userId, facilityId, memoryNodeId) {
        await this.updateFacility(userId, facilityId, { memoryNodeId });
    }
    // ── Healthcare Providers (human: doctor/nurse/health worker) ────────────────
    async createProvider(userId, fields) {
        const now = new Date().toISOString();
        const provider = { id: (0, uuid_1.v4)(), userId, ...fields, createdAt: now, updatedAt: now };
        await this.db.collection(PROVIDERS_COL(userId)).doc(provider.id).set(provider);
        return provider;
    }
    async getProvider(userId, providerId) {
        const snap = await this.db.collection(PROVIDERS_COL(userId)).doc(providerId).get();
        return snap.exists ? snap.data() : null;
    }
    async listProviders(userId, role) {
        let query = this.db.collection(PROVIDERS_COL(userId));
        if (role)
            query = query.where('role', '==', role);
        const snap = await query.get();
        return snap.docs.map((d) => d.data());
    }
    async deleteProvider(userId, providerId) {
        await this.db.collection(PROVIDERS_COL(userId)).doc(providerId).delete();
    }
}
exports.FacilityManager = FacilityManager;
//# sourceMappingURL=FacilityManager.js.map