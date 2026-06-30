import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireStringMax } from '../Validation'
import { ExecutionError } from '../Errors'
import { getSecurityEngine } from '../../security'

export interface RevokeRoleArgs {
  tenantId: string
  assignmentId: string
}

export interface RevokeRoleData {
  assignmentId: string
  revoked: boolean
}

/** Thin wrapper around SecurityEngine.revokeRoleAssignment — no raw Firestore writes here. */
export class RevokeRoleAction implements BaseAction<RevokeRoleArgs, RevokeRoleData> {
  readonly toolName = 'revokeRole'

  validate(args: RevokeRoleArgs): void {
    requireStringMax(args.tenantId, 'tenantId', 200)
    requireStringMax(args.assignmentId, 'assignmentId', 200)
  }

  async execute(args: RevokeRoleArgs, ctx: ActionContext): Promise<ActionResult<RevokeRoleData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getSecurityEngine(ctx.userId, ctx.db, apiKey)
      const revoked = await engine.revokeRoleAssignment(ctx.userId, args.tenantId, args.assignmentId)
      const data: RevokeRoleData = { assignmentId: args.assignmentId, revoked }
      return successResult(args.assignmentId, revoked ? 'Role assignment revoked.' : 'Role assignment not found.', data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {
    // Revocation has no automatic safe rollback (re-assignment would need full prior args); best-effort no-op.
  }

  audit(args: RevokeRoleArgs, ctx: ActionContext, result: ActionResult<RevokeRoleData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { tenantId: args.tenantId, assignmentId: args.assignmentId },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new RevokeRoleAction())
