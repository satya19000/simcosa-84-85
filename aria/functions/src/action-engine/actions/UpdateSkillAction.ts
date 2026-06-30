import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult, failureResult } from '../ActionResult'
import { requireString, optionalString } from '../Validation'
import { ExecutionError } from '../Errors'
import { getMarketplaceEngine } from '../../marketplace'

export interface UpdateSkillArgs {
  itemId: string
  description?: string
  version?: string
}

export interface UpdateSkillData {
  itemId: string
  status: string
}

/** Thin wrapper around MarketplaceEngine.updateSkill — no raw Firestore writes here. */
export class UpdateSkillAction implements BaseAction<UpdateSkillArgs, UpdateSkillData> {
  readonly toolName = 'updateSkill'

  validate(args: UpdateSkillArgs): void {
    requireString(args.itemId, 'itemId')
    optionalString(args.description, 'description')
    optionalString(args.version, 'version')
  }

  async execute(args: UpdateSkillArgs, ctx: ActionContext): Promise<ActionResult<UpdateSkillData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getMarketplaceEngine(ctx.userId, ctx.db, apiKey)
      const updated = await engine.updateSkill(args.itemId, {
        ...(args.description ? { description: args.description } : {}),
        ...(args.version ? { version: args.version } : {}),
      })
      if (!updated) {
        return failureResult(args.itemId, `Skill "${args.itemId}" not found.`, { code: 'EXECUTION_ERROR', detail: 'not found' }, elapsedMs(ctx))
      }
      const data: UpdateSkillData = { itemId: updated.itemId, status: updated.status }
      return successResult(updated.itemId, `Skill "${updated.itemId}" updated.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {}

  audit(args: UpdateSkillArgs, ctx: ActionContext, result: ActionResult<UpdateSkillData>): AuditRecord {
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
registry.register(new UpdateSkillAction())
