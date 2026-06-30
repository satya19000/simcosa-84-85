import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult, failureResult } from '../ActionResult'
import { requireString } from '../Validation'
import { ExecutionError } from '../Errors'
import { getMarketplaceEngine } from '../../marketplace'

export interface SubmitSkillForReviewArgs {
  itemId: string
}

export interface SubmitSkillForReviewData {
  itemId: string
  status: string
}

/** Thin wrapper around MarketplaceEngine.submitForReview — no raw Firestore writes here. */
export class SubmitSkillForReviewAction implements BaseAction<SubmitSkillForReviewArgs, SubmitSkillForReviewData> {
  readonly toolName = 'submitSkillForReview'

  validate(args: SubmitSkillForReviewArgs): void {
    requireString(args.itemId, 'itemId')
  }

  async execute(args: SubmitSkillForReviewArgs, ctx: ActionContext): Promise<ActionResult<SubmitSkillForReviewData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getMarketplaceEngine(ctx.userId, ctx.db, apiKey)
      const updated = await engine.submitForReview(args.itemId)
      if (!updated) {
        return failureResult(args.itemId, `Skill "${args.itemId}" not found.`, { code: 'EXECUTION_ERROR', detail: 'not found' }, elapsedMs(ctx))
      }
      const data: SubmitSkillForReviewData = { itemId: updated.itemId, status: updated.status }
      return successResult(updated.itemId, `Skill "${updated.itemId}" submitted for review.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {}

  audit(args: SubmitSkillForReviewArgs, ctx: ActionContext, result: ActionResult<SubmitSkillForReviewData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { itemId: args.itemId },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new SubmitSkillForReviewAction())
