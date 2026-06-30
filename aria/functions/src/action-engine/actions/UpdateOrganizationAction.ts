import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult, failureResult } from '../ActionResult'
import { requireString, optionalString, requireStringMax } from '../Validation'
import { ExecutionError } from '../Errors'
import { getOrganizationEngine } from '../../organization'

export interface UpdateOrganizationArgs {
  organizationId: string
  name?: string
  description?: string
}

export interface UpdateOrganizationData {
  organizationId: string
  name: string
}

export class UpdateOrganizationAction implements BaseAction<UpdateOrganizationArgs, UpdateOrganizationData> {
  readonly toolName = 'updateOrganization'

  validate(args: UpdateOrganizationArgs): void {
    requireString(args.organizationId, 'organizationId')
    if (args.name !== undefined) requireStringMax(args.name, 'name', 200)
    optionalString(args.description, 'description')
  }

  async execute(args: UpdateOrganizationArgs, ctx: ActionContext): Promise<ActionResult<UpdateOrganizationData>> {
    const actionId = `${args.organizationId}-update-${Date.now()}`
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getOrganizationEngine(ctx.userId, ctx.db, apiKey)
      const updated = await engine.updateOrganization(ctx.userId, args.organizationId, {
        name: args.name,
        description: args.description,
      })
      if (!updated) {
        return failureResult(actionId, 'Organization not found', { code: 'EXECUTION_ERROR', detail: 'not found' }, elapsedMs(ctx))
      }
      return successResult(actionId, `Organization "${updated.name}" updated.`, { organizationId: updated.organizationId, name: updated.name }, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {
    // No-op: update is not destructive enough to warrant automatic rollback; previous values aren't tracked here.
  }

  audit(args: UpdateOrganizationArgs, ctx: ActionContext, result: ActionResult<UpdateOrganizationData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { organizationId: args.organizationId, hasName: !!args.name, hasDescription: !!args.description },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new UpdateOrganizationAction())
