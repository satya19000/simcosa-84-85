"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationManager = void 0;
const uuid_1 = require("uuid");
const MissionEvents_1 = require("./MissionEvents");
/** Firestore repository for MissionRecommendations. */
class RecommendationManager {
    constructor(db) {
        this.db = db;
    }
    col(userId) {
        return this.db.collection('users').doc(userId).collection('missionRecommendations');
    }
    async create(userId, fields) {
        const now = new Date().toISOString();
        const rec = { ...fields, id: (0, uuid_1.v4)(), userId, status: 'open', createdAt: now, updatedAt: now };
        await this.col(userId).doc(rec.id).set(rec);
        void MissionEvents_1.MissionEvents.emit('recommendation:created', userId, { recommendationId: rec.id, sourceDomain: rec.sourceDomain });
        return rec;
    }
    async get(userId, id) {
        const doc = await this.col(userId).doc(id).get();
        return doc.exists ? doc.data() : null;
    }
    async list(userId, opts = {}) {
        let query = this.col(userId);
        if (opts.status)
            query = query.where('status', '==', opts.status);
        if (opts.sourceDomain)
            query = query.where('sourceDomain', '==', opts.sourceDomain);
        const snap = await query.orderBy('createdAt', 'desc').limit(200).get();
        let recs = snap.docs.map((d) => d.data());
        if (opts.minConfidence !== undefined)
            recs = recs.filter((r) => r.confidence >= opts.minConfidence);
        return recs;
    }
    async setStatus(userId, id, status, missionId) {
        const ref = this.col(userId).doc(id);
        const doc = await ref.get();
        if (!doc.exists)
            return null;
        const updatedAt = new Date().toISOString();
        const patch = { status, updatedAt };
        if (missionId)
            patch.missionId = missionId;
        await ref.update(patch);
        const updated = { ...doc.data(), ...patch };
        if (status === 'accepted')
            void MissionEvents_1.MissionEvents.emit('recommendation:accepted', userId, { recommendationId: id });
        if (status === 'dismissed')
            void MissionEvents_1.MissionEvents.emit('recommendation:dismissed', userId, { recommendationId: id });
        return updated;
    }
    /** Idempotency guard: avoid creating duplicate open recommendations for the same sourceRef. */
    async existsOpenForSourceRef(userId, sourceRef) {
        const snap = await this.col(userId).where('sourceRef', '==', sourceRef).where('status', '==', 'open').limit(1).get();
        return !snap.empty;
    }
    async expireOlderThan(userId, cutoffIso) {
        const snap = await this.col(userId).where('status', '==', 'open').where('createdAt', '<', cutoffIso).get();
        let count = 0;
        for (const doc of snap.docs) {
            await doc.ref.update({ status: 'expired', updatedAt: new Date().toISOString() });
            count++;
        }
        return count;
    }
}
exports.RecommendationManager = RecommendationManager;
//# sourceMappingURL=RecommendationManager.js.map