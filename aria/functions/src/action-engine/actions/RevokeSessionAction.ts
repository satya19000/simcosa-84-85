import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireStringMax } from '../Validation'
import { ExecutionError } from '../Errors'
import { getSecurityEngine } from '../../security'

export interface RevokeSessionArgs {
  tenantId: string
  sessionId: string
}

export interface RevokeSessionData {
  sessionId: string
  active: boolean
}

/** Thin wrapper around SecurityEngine.revokeSession — no raw Firestore writes here. */
export class RevokeSessionAction implements BaseAction<RevokeSessionArgs, RevokeSessionData> {
  readonly toolName = 'revokeSession'

  validate(args: RevokeSessionArgs): void {
    requireStringMax(args.tenantId, 'tenantId', 200)
    requireStringMax(args.sessionId, 'sessionId', 200)
  }

  async execute(args: RevokeSessionArgs, ctx: ActionContext): Promise<ActionResult<RevokeSessionData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getSecurityEngine(ctx.userId, ctx.db, apiKey)
      const session = await engine.revokeSession(ctx.userId, args.tenantId, args.sessionId)
      const data: RevokeSessionData = { sessionId: args.sessionId, active: session?.active ?? false }
      return successResult(args.sessionId, session ? 'Session revoked.' : 'Session not found.', data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {
    // Session revocation is a one-way security action; no rollback by design.
  }

  audit(args: RevokeSessionArgs, ctx: ActionContext, result: ActionResult<RevokeSessionData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { tenantId: args.tenantId, sessionId: args.sessionId },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new RevokeSessionAction())
