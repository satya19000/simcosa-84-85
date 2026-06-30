"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillReviewManager = void 0;
const uuid_1 = require("uuid");
const REVIEWS_COL = 'marketplace/reviews/reviews';
/** Repository for marketplace/reviews. Recomputes the parent item's rating rollup via MarketplaceRegistry.setRating. */
class SkillReviewManager {
    constructor(db, registry) {
        this.db = db;
        this.registry = registry;
    }
    async submitReview(actorUserId, itemId, input) {
        const reviewId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
            id: reviewId,
            reviewId,
            itemId,
            versionReviewed: input.versionReviewed,
            reviewerId: actorUserId,
            rating: input.rating,
            reviewText: input.reviewText.trim(),
            status: 'visible',
            createdBy: actorUserId,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(REVIEWS_COL).doc(reviewId).set(record);
        await this.recomputeRating(itemId);
        return record;
    }
    async listReviews(itemId) {
        const snap = await this.db.collection(REVIEWS_COL).where('itemId', '==', itemId).where('status', '==', 'visible').get();
        return snap.docs.map((d) => d.data());
    }
    async flagReview(reviewId) {
        const ref = this.db.collection(REVIEWS_COL).doc(reviewId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        await ref.update({ status: 'flagged', updatedAt: new Date().toISOString() });
        const updated = await ref.get();
        const review = updated.data();
        await this.recomputeRating(review.itemId);
        return review;
    }
    async recomputeRating(itemId) {
        const reviews = await this.listReviews(itemId);
        if (reviews.length === 0) {
            await this.registry.setRating(itemId, 0, 0);
            return;
        }
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        await this.registry.setRating(itemId, Math.round((sum / reviews.length) * 100) / 100, reviews.length);
    }
}
exports.SkillReviewManager = SkillReviewManager;
//# sourceMappingURL=SkillReviewManager.js.map