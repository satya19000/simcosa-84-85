import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult, failureResult } from '../ActionResult'
import { requireString } from '../Validation'
import { ExecutionError } from '../Errors'
import { getMarketplaceEngine } from '../../marketplace'

export interface EnableSkillArgs {
  tenantId: string
  installationId: string
}

export interface EnableSkillData {
  installationId: string
  status: string
}

/** Thin wrapper around MarketplaceEngine.enable — no raw Firestore writes here. */
export class EnableSkillAction implements BaseAction<EnableSkillArgs, EnableSkillData> {
  readonly toolName = 'enableSkill'

  validate(args: EnableSkillArgs): void {
    requireString(args.tenantId, 'tenantId')
    requireString(args.installationId, 'installationId')
  }

  async execute(args: EnableSkillArgs, ctx: ActionContext): Promise<ActionResult<EnableSkillData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getMarketplaceEngine(ctx.userId, ctx.db, apiKey)
      const updated = await engine.enable(ctx.userId, args.tenantId, args.installationId)
      if (!updated) {
        return failureResult(args.installationId, `Installation "${args.installationId}" not found.`, { code: 'EXECUTION_ERROR', detail: 'not found' }, elapsedMs(ctx))
      }
      const data: EnableSkillData = { installationId: updated.installationId, status: updated.status }
      return successResult(updated.installationId, `Skill installation "${updated.installationId}" enabled.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {}

  audit(args: EnableSkillArgs, ctx: ActionContext, result: ActionResult<EnableSkillData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { tenantId: args.tenantId, installationId: args.installationId },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new EnableSkillAction())
