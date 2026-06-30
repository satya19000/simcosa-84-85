import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult, failureResult } from '../ActionResult'
import { requireString } from '../Validation'
import { ExecutionError } from '../Errors'
import { getMarketplaceEngine } from '../../marketplace'

export interface RevokeSkillPermissionArgs {
  tenantId: string
  permissionId: string
}

export interface RevokeSkillPermissionData {
  permissionId: string
  granted: boolean
}

/** Thin wrapper around MarketplaceEngine.revokePermission — no raw Firestore writes here. */
export class RevokeSkillPermissionAction implements BaseAction<RevokeSkillPermissionArgs, RevokeSkillPermissionData> {
  readonly toolName = 'revokeSkillPermission'

  validate(args: RevokeSkillPermissionArgs): void {
    requireString(args.tenantId, 'tenantId')
    requireString(args.permissionId, 'permissionId')
  }

  async execute(args: RevokeSkillPermissionArgs, ctx: ActionContext): Promise<ActionResult<RevokeSkillPermissionData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getMarketplaceEngine(ctx.userId, ctx.db, apiKey)
      const updated = await engine.revokePermission(args.tenantId, ctx.userId, args.permissionId)
      if (!updated) {
        return failureResult(args.permissionId, `Permission grant "${args.permissionId}" not found.`, { code: 'EXECUTION_ERROR', detail: 'not found' }, elapsedMs(ctx))
      }
      const data: RevokeSkillPermissionData = { permissionId: updated.permissionId, granted: updated.granted }
      return successResult(updated.permissionId, `Permission "${updated.permissionId}" revoked.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {}

  audit(args: RevokeSkillPermissionArgs, ctx: ActionContext, result: ActionResult<RevokeSkillPermissionData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { tenantId: args.tenantId, permissionId: args.permissionId },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new RevokeSkillPermissionAction())
