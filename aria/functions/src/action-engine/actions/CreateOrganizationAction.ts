import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireStringMax, optionalString, requireOneOf } from '../Validation'
import { ExecutionError } from '../Errors'
import { getOrganizationEngine } from '../../organization'
import type { OrganizationType } from '../../organization/WorkspaceTypes'

const ORG_TYPES: OrganizationType[] = ['personal', 'team', 'department', 'hospital', 'government_office', 'enterprise']

export interface CreateOrganizationArgs {
  name: string
  type: OrganizationType
  description?: string
}

export interface CreateOrganizationData {
  organizationId: string
  name: string
  type: OrganizationType
}

/** Thin wrapper around OrganizationEngine.createOrganization — no raw Firestore writes here. */
export class CreateOrganizationAction implements BaseAction<CreateOrganizationArgs, CreateOrganizationData> {
  readonly toolName = 'createOrganization'

  validate(args: CreateOrganizationArgs): void {
    requireStringMax(args.name, 'name', 200)
    requireOneOf(args.type, 'type', ORG_TYPES)
    optionalString(args.description, 'description')
  }

  async execute(args: CreateOrganizationArgs, ctx: ActionContext): Promise<ActionResult<CreateOrganizationData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getOrganizationEngine(ctx.userId, ctx.db, apiKey)
      const org = await engine.createOrganization(ctx.userId, {
        name: args.name,
        type: args.type,
        description: args.description,
      })
      const data: CreateOrganizationData = { organizationId: org.organizationId, name: org.name, type: org.type }
      return successResult(org.organizationId, `Organization "${org.name}" created.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {
    // Organization creation has no safe automatic rollback (would orphan member records mid-flight
    // in edge cases); best-effort no-op, mirroring CreateTaskAction's documented intentional limitation.
  }

  audit(args: CreateOrganizationArgs, ctx: ActionContext, result: ActionResult<CreateOrganizationData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { name: args.name, type: args.type },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new CreateOrganizationAction())
