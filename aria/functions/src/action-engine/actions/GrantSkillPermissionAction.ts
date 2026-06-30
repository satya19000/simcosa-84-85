import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireString } from '../Validation'
import { ValidationError, ExecutionError } from '../Errors'
import { getMarketplaceEngine } from '../../marketplace'
import { SKILL_PERMISSION_SCOPES, type SkillPermissionScope } from '../../marketplace/MarketplaceTypes'

export interface GrantSkillPermissionArgs {
  tenantId: string
  installationId: string
  itemId: string
  scopes: SkillPermissionScope[]
}

export interface GrantSkillPermissionData {
  installationId: string
  grantedCount: number
}

/** Thin wrapper around MarketplaceEngine.grantPermission — no raw Firestore writes here. */
export class GrantSkillPermissionAction implements BaseAction<GrantSkillPermissionArgs, GrantSkillPermissionData> {
  readonly toolName = 'grantSkillPermission'

  validate(args: GrantSkillPermissionArgs): void {
    requireString(args.tenantId, 'tenantId')
    requireString(args.installationId, 'installationId')
    requireString(args.itemId, 'itemId')
    if (!Array.isArray(args.scopes) || args.scopes.some((s) => !SKILL_PERMISSION_SCOPES.includes(s))) {
      throw new ValidationError('scopes', `must be an array of valid permission scopes: ${SKILL_PERMISSION_SCOPES.join(', ')}`)
    }
  }

  async execute(args: GrantSkillPermissionArgs, ctx: ActionContext): Promise<ActionResult<GrantSkillPermissionData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getMarketplaceEngine(ctx.userId, ctx.db, apiKey)
      const grants = await engine.grantPermission(args.tenantId, ctx.userId, args.installationId, args.itemId, args.scopes)
      const data: GrantSkillPermissionData = { installationId: args.installationId, grantedCount: grants.length }
      return successResult(args.installationId, `Granted ${grants.length} permission scope(s) to installation "${args.installationId}".`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {}

  audit(args: GrantSkillPermissionArgs, ctx: ActionContext, result: ActionResult<GrantSkillPermissionData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { tenantId: args.tenantId, installationId: args.installationId, scopes: args.scopes },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new GrantSkillPermissionAction())
