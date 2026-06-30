import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireStringMax, requireOneOf } from '../Validation'
import { ExecutionError, ValidationError } from '../Errors'
import { getSecurityEngine } from '../../security'
import { PERMISSION_ACTIONS } from '../../security/SecurityTypes'
import type { RoleScope, PermissionAction } from '../../security/SecurityTypes'

const ROLE_SCOPES: RoleScope[] = ['tenant', 'organization', 'workspace']

export interface CreateRoleArgs {
  tenantId: string
  name: string
  scope: RoleScope
  permissions: PermissionAction[]
  inheritsFrom?: string
}

export interface CreateRoleData {
  roleId: string
  name: string
  scope: RoleScope
}

/** Thin wrapper around SecurityEngine.createRole — no raw Firestore writes here. */
export class CreateRoleAction implements BaseAction<CreateRoleArgs, CreateRoleData> {
  readonly toolName = 'createRole'

  validate(args: CreateRoleArgs): void {
    requireStringMax(args.tenantId, 'tenantId', 200)
    requireStringMax(args.name, 'name', 200)
    requireOneOf(args.scope, 'scope', ROLE_SCOPES)
    if (!Array.isArray(args.permissions) || args.permissions.some((p) => !PERMISSION_ACTIONS.includes(p))) {
      throw new ValidationError('permissions', `must be an array of valid permission actions`)
    }
  }

  async execute(args: CreateRoleArgs, ctx: ActionContext): Promise<ActionResult<CreateRoleData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getSecurityEngine(ctx.userId, ctx.db, apiKey)
      const role = await engine.createRole(ctx.userId, args.tenantId, {
        name: args.name,
        scope: args.scope,
        permissions: args.permissions,
        inheritsFrom: args.inheritsFrom ?? null,
      })
      const data: CreateRoleData = { roleId: role.roleId, name: role.name, scope: role.scope }
      return successResult(role.roleId, `Role "${role.name}" created.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {
    // Role creation has no automatic safe rollback; best-effort no-op.
  }

  audit(args: CreateRoleArgs, ctx: ActionContext, result: ActionResult<CreateRoleData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { tenantId: args.tenantId, name: args.name, scope: args.scope },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new CreateRoleAction())
