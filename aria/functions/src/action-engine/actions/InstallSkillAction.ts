import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireString, optionalString } from '../Validation'
import { ExecutionError } from '../Errors'
import { getMarketplaceEngine } from '../../marketplace'

export interface InstallSkillArgs {
  tenantId: string
  itemId: string
  organizationId?: string
}

export interface InstallSkillData {
  installationId: string
  status: string
  approvalRequestId: string | null
}

/** Thin wrapper around MarketplaceEngine.install (the 11-step pipeline lives in SkillInstaller) — no raw Firestore writes here. */
export class InstallSkillAction implements BaseAction<InstallSkillArgs, InstallSkillData> {
  readonly toolName = 'installSkill'

  validate(args: InstallSkillArgs): void {
    requireString(args.tenantId, 'tenantId')
    requireString(args.itemId, 'itemId')
    optionalString(args.organizationId, 'organizationId')
  }

  async execute(args: InstallSkillArgs, ctx: ActionContext): Promise<ActionResult<InstallSkillData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getMarketplaceEngine(ctx.userId, ctx.db, apiKey)
      const installation = await engine.install(ctx.userId, {
        tenantId: args.tenantId,
        organizationId: args.organizationId ?? null,
        itemId: args.itemId,
      })
      const data: InstallSkillData = {
        installationId: installation.installationId,
        status: installation.status,
        approvalRequestId: installation.approvalRequestId,
      }
      const message = installation.approvalRequestId && installation.status === 'submitted'
        ? `Skill install for "${args.itemId}" is pending approval (request ${installation.approvalRequestId}).`
        : `Skill "${args.itemId}" installed.`
      return successResult(installation.installationId, message, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(args: InstallSkillArgs, ctx: ActionContext): Promise<void> {
    void args
    void ctx
    // Best-effort: install partial-failure cleanup is handled inside SkillInstaller itself.
  }

  audit(args: InstallSkillArgs, ctx: ActionContext, result: ActionResult<InstallSkillData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { tenantId: args.tenantId, itemId: args.itemId },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new InstallSkillAction())
