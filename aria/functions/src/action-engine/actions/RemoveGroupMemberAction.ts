import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireStringMax } from '../Validation'
import { ExecutionError } from '../Errors'
import { getSecurityEngine } from '../../security'

export interface RemoveGroupMemberArgs {
  tenantId: string
  groupId: string
  identityId: string
}

export interface RemoveGroupMemberData {
  groupId: string
  memberIdentityIds: string[]
}

/** Thin wrapper around SecurityEngine.removeMemberFromGroup — no raw Firestore writes here. */
export class RemoveGroupMemberAction implements BaseAction<RemoveGroupMemberArgs, RemoveGroupMemberData> {
  readonly toolName = 'removeGroupMember'

  validate(args: RemoveGroupMemberArgs): void {
    requireStringMax(args.tenantId, 'tenantId', 200)
    requireStringMax(args.groupId, 'groupId', 200)
    requireStringMax(args.identityId, 'identityId', 200)
  }

  async execute(args: RemoveGroupMemberArgs, ctx: ActionContext): Promise<ActionResult<RemoveGroupMemberData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getSecurityEngine(ctx.userId, ctx.db, apiKey)
      const group = await engine.removeMemberFromGroup(ctx.userId, args.tenantId, args.groupId, args.identityId)
      const data: RemoveGroupMemberData = { groupId: args.groupId, memberIdentityIds: group?.memberIdentityIds ?? [] }
      return successResult(args.groupId, group ? 'Member removed from group.' : 'Group not found.', data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(args: RemoveGroupMemberArgs, ctx: ActionContext): Promise<void> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getSecurityEngine(ctx.userId, ctx.db, apiKey)
      await engine.addMemberToGroup(ctx.userId, args.tenantId, args.groupId, args.identityId)
    } catch {
      // Rollback is best-effort
    }
  }

  audit(args: RemoveGroupMemberArgs, ctx: ActionContext, result: ActionResult<RemoveGroupMemberData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { tenantId: args.tenantId, groupId: args.groupId, identityId: args.identityId },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new RemoveGroupMemberAction())
