import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { SkillReviewRecord } from './MarketplaceTypes'
import type { MarketplaceRegistry } from './MarketplaceRegistry'

const REVIEWS_COL = 'marketplace/reviews/reviews'

/** Repository for marketplace/reviews. Recomputes the parent item's rating rollup via MarketplaceRegistry.setRating. */
export class SkillReviewManager {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly registry: MarketplaceRegistry
  ) {}

  async submitReview(
    actorUserId: string,
    itemId: string,
    input: { rating: number; reviewText: string; versionReviewed: string }
  ): Promise<SkillReviewRecord> {
    const reviewId = uuidv4()
    const now = new Date().toISOString()
    const record: SkillReviewRecord = {
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
    }
    await this.db.collection(REVIEWS_COL).doc(reviewId).set(record)
    await this.recomputeRating(itemId)
    return record
  }

  async listReviews(itemId: string): Promise<SkillReviewRecord[]> {
    const snap = await this.db.collection(REVIEWS_COL).where('itemId', '==', itemId).where('status', '==', 'visible').get()
    return snap.docs.map((d) => d.data() as SkillReviewRecord)
  }

  async flagReview(reviewId: string): Promise<SkillReviewRecord | null> {
    const ref = this.db.collection(REVIEWS_COL).doc(reviewId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ status: 'flagged', updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    const review = updated.data() as SkillReviewRecord
    await this.recomputeRating(review.itemId)
    return review
  }

  private async recomputeRating(itemId: string): Promise<void> {
    const reviews = await this.listReviews(itemId)
    if (reviews.length === 0) {
      await this.registry.setRating(itemId, 0, 0)
      return
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    await this.registry.setRating(itemId, Math.round((sum / reviews.length) * 100) / 100, reviews.length)
  }
}
