import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult, failureResult } from '../ActionResult'
import { requireString } from '../Validation'
import { ExecutionError } from '../Errors'
import { getOrganizationEngine } from '../../organization'

export interface RemoveMemberArgs {
  organizationId: string
  memberId: string
}

export interface RemoveMemberData {
  organizationId: string
  memberId: string
}

export class RemoveMemberAction implements BaseAction<RemoveMemberArgs, RemoveMemberData> {
  readonly toolName = 'removeMember'

  validate(args: RemoveMemberArgs): void {
    requireString(args.organizationId, 'organizationId')
    requireString(args.memberId, 'memberId')
  }

  async execute(args: RemoveMemberArgs, ctx: ActionContext): Promise<ActionResult<RemoveMemberData>> {
    const actionId = `${args.memberId}-remove-${Date.now()}`
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getOrganizationEngine(ctx.userId, ctx.db, apiKey)
      const removed = await engine.removeMember(ctx.userId, args.organizationId, args.memberId)
      if (!removed) {
        return failureResult(actionId, 'Member not found', { code: 'EXECUTION_ERROR', detail: 'not found' }, elapsedMs(ctx))
      }
      return successResult(actionId, `Member ${removed.displayName} removed.`, { organizationId: args.organizationId, memberId: args.memberId }, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(_args: RemoveMemberArgs, _ctx: ActionContext): Promise<void> {
    // Best-effort no-op: removal is a soft status flip (status: 'removed'); there is no
    // automatic "re-add" path here because role/workspaceIds at time of removal aren't tracked
    // separately. An admin can re-invite the member manually if removal was a mistake.
  }

  audit(args: RemoveMemberArgs, ctx: ActionContext, result: ActionResult<RemoveMemberData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { organizationId: args.organizationId, memberId: args.memberId },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new RemoveMemberAction())
