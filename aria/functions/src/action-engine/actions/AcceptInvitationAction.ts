import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireString } from '../Validation'
import { ExecutionError } from '../Errors'
import { getOrganizationEngine } from '../../organization'

export interface AcceptInvitationArgs {
  organizationId: string
  invitationId: string
}

export interface AcceptInvitationData {
  organizationId: string
  memberId: string
  role: string
}

export class AcceptInvitationAction implements BaseAction<AcceptInvitationArgs, AcceptInvitationData> {
  readonly toolName = 'acceptInvitation'

  validate(args: AcceptInvitationArgs): void {
    requireString(args.organizationId, 'organizationId')
    requireString(args.invitationId, 'invitationId')
  }

  async execute(args: AcceptInvitationArgs, ctx: ActionContext): Promise<ActionResult<AcceptInvitationData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getOrganizationEngine(ctx.userId, ctx.db, apiKey)
      const member = await engine.acceptInvitation(ctx.userId, args.organizationId, args.invitationId, {
        displayName: ctx.userDisplayName ?? 'New member',
        email: '',
      })
      const data: AcceptInvitationData = { organizationId: args.organizationId, memberId: member.memberId, role: member.role }
      return successResult(member.memberId, `Joined organization as ${member.role}.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(args: AcceptInvitationArgs, ctx: ActionContext): Promise<void> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getOrganizationEngine(ctx.userId, ctx.db, apiKey)
      const member = await engine.permissionsApi.getMembership(args.organizationId, ctx.userId)
      if (member) await engine.removeMember(ctx.userId, args.organizationId, member.memberId)
    } catch {
      // best-effort
    }
  }

  audit(args: AcceptInvitationArgs, ctx: ActionContext, result: ActionResult<AcceptInvitationData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { organizationId: args.organizationId, invitationId: args.invitationId },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new AcceptInvitationAction())
