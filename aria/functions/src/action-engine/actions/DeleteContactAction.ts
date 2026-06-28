import { v4 as uuidv4 } from 'uuid'
import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireString } from '../Validation'
import { ExecutionError } from '../Errors'

export interface DeleteContactArgs {
  contactId: string
}

export interface DeleteContactData {
  contactId: string
}

export class DeleteContactAction implements BaseAction<DeleteContactArgs, DeleteContactData> {
  readonly toolName = 'deleteContact'

  validate(args: DeleteContactArgs): void {
    requireString(args.contactId, 'contactId')
  }

  async execute(args: DeleteContactArgs, ctx: ActionContext): Promise<ActionResult<DeleteContactData>> {
    const actionId = uuidv4()
    try {
      const ref = ctx.db.collection('users').doc(ctx.userId).collection('contacts').doc(args.contactId)
      const snap = await ref.get()
      if (!snap.exists) throw new Error(`Contact "${args.contactId}" not found.`)

      await ref.delete()
      return successResult(actionId, 'Contact deleted.', { contactId: args.contactId }, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(_args: DeleteContactArgs, _ctx: ActionContext): Promise<void> {}

  audit(args: DeleteContactArgs, ctx: ActionContext, result: ActionResult<DeleteContactData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { contactId: args.contactId },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new DeleteContactAction())
