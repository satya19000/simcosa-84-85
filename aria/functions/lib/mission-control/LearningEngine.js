"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningEngine = void 0;
const uuid_1 = require("uuid");
/**
 * Heuristic learning loop: every accept/dismiss on a MissionRecommendation
 * is logged as a RecommendationOutcome, and a per-domain acceptance rate is
 * used to scale future recommendation confidence up or down. This is
 * intentionally simple counting statistics — NOT a trained model. A real
 * ML-based scorer is a reasonable Phase 5.1 addition (see README).
 */
class LearningEngine {
    constructor(db, config) {
        this.db = db;
        this.config = config;
    }
    col(userId) {
        return this.db.collection('users').doc(userId).collection('missionRecommendationOutcomes');
    }
    async recordOutcome(userId, recommendationId, sourceDomain, accepted) {
        const outcome = {
            id: (0, uuid_1.v4)(),
            userId,
            recommendationId,
            sourceDomain,
            accepted,
            recordedAt: new Date().toISOString(),
        };
        await this.col(userId).doc(outcome.id).set(outcome);
        return outcome;
    }
    async getSnapshot(userId, sourceDomain) {
        const snap = await this.col(userId).where('sourceDomain', '==', sourceDomain).get();
        const outcomes = snap.docs.map((d) => d.data());
        const totalShown = outcomes.length;
        const totalAccepted = outcomes.filter((o) => o.accepted).length;
        const acceptanceRate = totalShown > 0 ? totalAccepted / totalShown : 0.5; // neutral prior with no data
        return {
            sourceDomain,
            totalShown,
            totalAccepted,
            acceptanceRate,
            confidenceAdjustment: this.rateToAdjustment(acceptanceRate, totalShown),
        };
    }
    async getAllSnapshots(userId) {
        const domains = ['finance', 'health', 'delegation', 'communication', 'general'];
        return Promise.all(domains.map((d) => this.getSnapshot(userId, d)));
    }
    /** Multiplier applied by RecommendationEngine when scoring new recommendations from this domain. */
    async getConfidenceAdjustment(userId, sourceDomain) {
        const snapshot = await this.getSnapshot(userId, sourceDomain);
        return snapshot.confidenceAdjustment;
    }
    // Maps acceptance rate (0-1) onto a bounded multiplier. With too few
    // samples (<5), stays neutral (1.0) to avoid over-reacting to noise.
    rateToAdjustment(rate, sampleSize) {
        if (sampleSize < 5)
            return 1.0;
        const raw = 0.5 + rate; // rate 0 -> 0.5, rate 1 -> 1.5
        return Math.max(this.config.minConfidenceAdjustment, Math.min(this.config.maxConfidenceAdjustment, raw));
    }
}
exports.LearningEngine = LearningEngine;
//# sourceMappingURL=LearningEngine.js.map