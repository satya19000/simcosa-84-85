import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireStringMax } from '../Validation'
import { ExecutionError } from '../Errors'
import { getSecurityEngine } from '../../security'

export interface AddGroupMemberArgs {
  tenantId: string
  groupId: string
  identityId: string
}

export interface AddGroupMemberData {
  groupId: string
  memberIdentityIds: string[]
}

/** Thin wrapper around SecurityEngine.addMemberToGroup — no raw Firestore writes here. */
export class AddGroupMemberAction implements BaseAction<AddGroupMemberArgs, AddGroupMemberData> {
  readonly toolName = 'addGroupMember'

  validate(args: AddGroupMemberArgs): void {
    requireStringMax(args.tenantId, 'tenantId', 200)
    requireStringMax(args.groupId, 'groupId', 200)
    requireStringMax(args.identityId, 'identityId', 200)
  }

  async execute(args: AddGroupMemberArgs, ctx: ActionContext): Promise<ActionResult<AddGroupMemberData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getSecurityEngine(ctx.userId, ctx.db, apiKey)
      const group = await engine.addMemberToGroup(ctx.userId, args.tenantId, args.groupId, args.identityId)
      const data: AddGroupMemberData = { groupId: args.groupId, memberIdentityIds: group?.memberIdentityIds ?? [] }
      return successResult(args.groupId, group ? 'Member added to group.' : 'Group not found.', data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(args: AddGroupMemberArgs, ctx: ActionContext): Promise<void> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getSecurityEngine(ctx.userId, ctx.db, apiKey)
      await engine.removeMemberFromGroup(ctx.userId, args.tenantId, args.groupId, args.identityId)
    } catch {
      // Rollback is best-effort
    }
  }

  audit(args: AddGroupMemberArgs, ctx: ActionContext, result: ActionResult<AddGroupMemberData>): AuditRecord {
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
registry.register(new AddGroupMemberAction())
