import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireStringMax, optionalString } from '../Validation'
import { ExecutionError } from '../Errors'
import { getSecurityEngine } from '../../security'

export interface CreateGroupArgs {
  tenantId: string
  name: string
  description?: string
}

export interface CreateGroupData {
  groupId: string
  name: string
}

/** Thin wrapper around SecurityEngine.createGroup — no raw Firestore writes here. */
export class CreateGroupAction implements BaseAction<CreateGroupArgs, CreateGroupData> {
  readonly toolName = 'createGroup'

  validate(args: CreateGroupArgs): void {
    requireStringMax(args.tenantId, 'tenantId', 200)
    requireStringMax(args.name, 'name', 200)
    optionalString(args.description, 'description')
  }

  async execute(args: CreateGroupArgs, ctx: ActionContext): Promise<ActionResult<CreateGroupData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getSecurityEngine(ctx.userId, ctx.db, apiKey)
      const group = await engine.createGroup(ctx.userId, args.tenantId, { name: args.name, description: args.description })
      const data: CreateGroupData = { groupId: group.groupId, name: group.name }
      return successResult(group.groupId, `Group "${group.name}" created.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {
    // Group creation has no automatic safe rollback; best-effort no-op.
  }

  audit(args: CreateGroupArgs, ctx: ActionContext, result: ActionResult<CreateGroupData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { tenantId: args.tenantId, name: args.name },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new CreateGroupAction())
