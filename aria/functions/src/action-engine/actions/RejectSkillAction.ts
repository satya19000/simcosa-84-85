import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult, failureResult } from '../ActionResult'
import { requireString } from '../Validation'
import { ExecutionError } from '../Errors'
import { getMarketplaceEngine } from '../../marketplace'

export interface RejectSkillArgs {
  itemId: string
}

export interface RejectSkillData {
  itemId: string
  status: string
}

/** Thin wrapper around MarketplaceEngine.reject — no raw Firestore writes here. */
export class RejectSkillAction implements BaseAction<RejectSkillArgs, RejectSkillData> {
  readonly toolName = 'rejectSkill'

  validate(args: RejectSkillArgs): void {
    requireString(args.itemId, 'itemId')
  }

  async execute(args: RejectSkillArgs, ctx: ActionContext): Promise<ActionResult<RejectSkillData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getMarketplaceEngine(ctx.userId, ctx.db, apiKey)
      const updated = await engine.reject(args.itemId)
      if (!updated) {
        return failureResult(args.itemId, `Skill "${args.itemId}" not found.`, { code: 'EXECUTION_ERROR', detail: 'not found' }, elapsedMs(ctx))
      }
      const data: RejectSkillData = { itemId: updated.itemId, status: updated.status }
      return successResult(updated.itemId, `Skill "${updated.itemId}" rejected, returned to draft.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {}

  audit(args: RejectSkillArgs, ctx: ActionContext, result: ActionResult<RejectSkillData>): AuditRecord {
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
registry.register(new RejectSkillAction())
