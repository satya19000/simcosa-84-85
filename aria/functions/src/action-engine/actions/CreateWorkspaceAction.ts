import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireString, requireStringMax, optionalString } from '../Validation'
import { ExecutionError } from '../Errors'
import { getOrganizationEngine } from '../../organization'

export interface CreateWorkspaceArgs {
  organizationId: string
  name: string
  description?: string
}

export interface CreateWorkspaceData {
  organizationId: string
  workspaceId: string
  name: string
}

export class CreateWorkspaceAction implements BaseAction<CreateWorkspaceArgs, CreateWorkspaceData> {
  readonly toolName = 'createWorkspace'

  validate(args: CreateWorkspaceArgs): void {
    requireString(args.organizationId, 'organizationId')
    requireStringMax(args.name, 'name', 200)
    optionalString(args.description, 'description')
  }

  async execute(args: CreateWorkspaceArgs, ctx: ActionContext): Promise<ActionResult<CreateWorkspaceData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getOrganizationEngine(ctx.userId, ctx.db, apiKey)
      const workspace = await engine.createWorkspace(ctx.userId, args.organizationId, {
        name: args.name,
        description: args.description,
      })
      const data: CreateWorkspaceData = { organizationId: args.organizationId, workspaceId: workspace.workspaceId, name: workspace.name }
      return successResult(workspace.workspaceId, `Workspace "${workspace.name}" created.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {
    // Best-effort no-op — see CreateOrganizationAction for rationale.
  }

  audit(args: CreateWorkspaceArgs, ctx: ActionContext, result: ActionResult<CreateWorkspaceData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { organizationId: args.organizationId, name: args.name },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new CreateWorkspaceAction())
