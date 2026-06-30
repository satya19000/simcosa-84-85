"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionManager = void 0;
const uuid_1 = require("uuid");
const MissionEvents_1 = require("./MissionEvents");
/** Firestore repository for MissionPredictions (append-only log, latest-wins per targetId+kind reads). */
class PredictionManager {
    constructor(db) {
        this.db = db;
    }
    col(userId) {
        return this.db.collection('users').doc(userId).collection('missionPredictions');
    }
    async record(userId, fields) {
        const prediction = { ...fields, id: (0, uuid_1.v4)(), generatedAt: new Date().toISOString() };
        await this.col(userId).doc(prediction.id).set(prediction);
        void MissionEvents_1.MissionEvents.emit('prediction:generated', userId, { predictionId: prediction.id, kind: prediction.kind });
        return prediction;
    }
    async latestFor(userId, targetId, kind) {
        const snap = await this.col(userId)
            .where('targetId', '==', targetId)
            .where('kind', '==', kind)
            .orderBy('generatedAt', 'desc')
            .limit(1)
            .get();
        return snap.empty ? null : snap.docs[0].data();
    }
    async listForUser(userId, kind) {
        let query = this.col(userId);
        if (kind)
            query = query.where('kind', '==', kind);
        const snap = await query.orderBy('generatedAt', 'desc').limit(200).get();
        return snap.docs.map((d) => d.data());
    }
}
exports.PredictionManager = PredictionManager;
//# sourceMappingURL=PredictionManager.js.map