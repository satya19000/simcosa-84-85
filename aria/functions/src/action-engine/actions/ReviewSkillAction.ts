import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireString, requireStringMax } from '../Validation'
import { ValidationError, ExecutionError } from '../Errors'
import { getMarketplaceEngine } from '../../marketplace'

export interface ReviewSkillArgs {
  itemId: string
  rating: number
  reviewText: string
  versionReviewed: string
}

export interface ReviewSkillData {
  reviewId: string
  itemId: string
  rating: number
}

/** Thin wrapper around MarketplaceEngine.recordReview — no raw Firestore writes here. */
export class ReviewSkillAction implements BaseAction<ReviewSkillArgs, ReviewSkillData> {
  readonly toolName = 'reviewSkill'

  validate(args: ReviewSkillArgs): void {
    requireString(args.itemId, 'itemId')
    requireStringMax(args.reviewText, 'reviewText', 4000)
    requireString(args.versionReviewed, 'versionReviewed')
    if (typeof args.rating !== 'number' || args.rating < 1 || args.rating > 5) {
      throw new ValidationError('rating', 'must be a number between 1 and 5')
    }
  }

  async execute(args: ReviewSkillArgs, ctx: ActionContext): Promise<ActionResult<ReviewSkillData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getMarketplaceEngine(ctx.userId, ctx.db, apiKey)
      const review = await engine.recordReview(ctx.userId, args.itemId, {
        rating: args.rating,
        reviewText: args.reviewText,
        versionReviewed: args.versionReviewed,
      })
      const data: ReviewSkillData = { reviewId: review.reviewId, itemId: review.itemId, rating: review.rating }
      return successResult(review.reviewId, `Review submitted for skill "${args.itemId}".`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {}

  audit(args: ReviewSkillArgs, ctx: ActionContext, result: ActionResult<ReviewSkillData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { itemId: args.itemId, rating: args.rating },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new ReviewSkillAction())
