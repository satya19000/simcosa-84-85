import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireString, optionalString, requireOneOf } from '../Validation'
import { ExecutionError, ValidationError } from '../Errors'
import { getOrganizationEngine } from '../../organization'
import type { MemberRole } from '../../organization/WorkspaceTypes'

const ROLES: MemberRole[] = ['owner', 'admin', 'manager', 'supervisor', 'staff', 'guest', 'viewer']

export interface InviteMemberArgs {
  organizationId: string
  email: string
  role: MemberRole
  workspaceId?: string
}

export interface InviteMemberData {
  invitationId: string
  email: string
  role: MemberRole
}

export class InviteMemberAction implements BaseAction<InviteMemberArgs, InviteMemberData> {
  readonly toolName = 'inviteMember'

  validate(args: InviteMemberArgs): void {
    requireString(args.organizationId, 'organizationId')
    if (typeof args.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) {
      throw new ValidationError('email', 'must be a valid email address')
    }
    requireOneOf(args.role, 'role', ROLES)
    optionalString(args.workspaceId, 'workspaceId')
  }

  async execute(args: InviteMemberArgs, ctx: ActionContext): Promise<ActionResult<InviteMemberData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getOrganizationEngine(ctx.userId, ctx.db, apiKey)
      const invitation = await engine.inviteMember(ctx.userId, args.organizationId, {
        email: args.email,
        role: args.role,
        workspaceId: args.workspaceId ?? null,
      })
      const data: InviteMemberData = { invitationId: invitation.invitationId, email: invitation.email, role: invitation.role }
      return successResult(invitation.invitationId, `Invited ${invitation.email} as ${invitation.role}.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(args: InviteMemberArgs, ctx: ActionContext): Promise<void> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getOrganizationEngine(ctx.userId, ctx.db, apiKey)
      const invitations = await engine.listInvitations(ctx.userId, args.organizationId)
      const pending = invitations.find((i) => i.email === args.email.trim().toLowerCase() && i.status === 'pending')
      if (pending) await engine.revokeInvitation(ctx.userId, args.organizationId, pending.invitationId)
    } catch {
      // best-effort
    }
  }

  audit(args: InviteMemberArgs, ctx: ActionContext, result: ActionResult<InviteMemberData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { organizationId: args.organizationId, email: args.email, role: args.role },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new InviteMemberAction())
