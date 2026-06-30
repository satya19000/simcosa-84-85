import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireStringMax, optionalString, optionalISODate, requireOneOf } from '../Validation'
import { ExecutionError } from '../Errors'
import { getSecurityEngine } from '../../security'
import type { RoleScope } from '../../security/SecurityTypes'

const ROLE_SCOPES: RoleScope[] = ['tenant', 'organization', 'workspace']

export interface AssignRoleArgs {
  tenantId: string
  identityId: string
  roleId: string
  scope: RoleScope
  scopeId?: string
  expiresAt?: string
}

export interface AssignRoleData {
  assignmentId: string
  identityId: string
  roleId: string
}

/** Thin wrapper around SecurityEngine.assignRole — no raw Firestore writes here. */
export class AssignRoleAction implements BaseAction<AssignRoleArgs, AssignRoleData> {
  readonly toolName = 'assignRole'

  validate(args: AssignRoleArgs): void {
    requireStringMax(args.tenantId, 'tenantId', 200)
    requireStringMax(args.identityId, 'identityId', 200)
    requireStringMax(args.roleId, 'roleId', 200)
    requireOneOf(args.scope, 'scope', ROLE_SCOPES)
    optionalString(args.scopeId, 'scopeId')
    optionalISODate(args.expiresAt, 'expiresAt')
  }

  async execute(args: AssignRoleArgs, ctx: ActionContext): Promise<ActionResult<AssignRoleData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getSecurityEngine(ctx.userId, ctx.db, apiKey)
      const assignment = await engine.assignRole(ctx.userId, args.tenantId, {
        identityId: args.identityId,
        roleId: args.roleId,
        scope: args.scope,
        scopeId: args.scopeId ?? null,
        expiresAt: args.expiresAt ?? null,
        delegatedBy: ctx.userId,
      })
      const data: AssignRoleData = { assignmentId: assignment.assignmentId, identityId: assignment.identityId, roleId: assignment.roleId }
      return successResult(assignment.assignmentId, `Role assigned to identity ${assignment.identityId}.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(args: AssignRoleArgs, ctx: ActionContext): Promise<void> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getSecurityEngine(ctx.userId, ctx.db, apiKey)
      // Best-effort: nothing to roll back precisely without the assignmentId; no-op.
      void engine
      void args
    } catch {
      // Rollback is best-effort
    }
  }

  audit(args: AssignRoleArgs, ctx: ActionContext, result: ActionResult<AssignRoleData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { tenantId: args.tenantId, identityId: args.identityId, roleId: args.roleId, scope: args.scope },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new AssignRoleAction())
