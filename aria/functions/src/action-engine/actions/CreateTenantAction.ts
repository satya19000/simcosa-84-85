import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireStringMax, optionalString, requireOneOf } from '../Validation'
import { ExecutionError } from '../Errors'
import { getSecurityEngine } from '../../security'
import type { TenantType } from '../../security/SecurityTypes'

const TENANT_TYPES: TenantType[] = ['personal', 'organization', 'enterprise', 'government', 'healthcare', 'education']

export interface CreateTenantArgs {
  name: string
  tenantType: TenantType
  organizationId?: string
}

export interface CreateTenantData {
  tenantId: string
  name: string
  tenantType: TenantType
}

/** Thin wrapper around SecurityEngine.createTenant — no raw Firestore writes here. */
export class CreateTenantAction implements BaseAction<CreateTenantArgs, CreateTenantData> {
  readonly toolName = 'createTenant'

  validate(args: CreateTenantArgs): void {
    requireStringMax(args.name, 'name', 200)
    requireOneOf(args.tenantType, 'tenantType', TENANT_TYPES)
    optionalString(args.organizationId, 'organizationId')
  }

  async execute(args: CreateTenantArgs, ctx: ActionContext): Promise<ActionResult<CreateTenantData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getSecurityEngine(ctx.userId, ctx.db, apiKey)
      const tenant = await engine.createTenant(ctx.userId, {
        name: args.name,
        tenantType: args.tenantType,
        organizationId: args.organizationId ?? null,
      })
      const data: CreateTenantData = { tenantId: tenant.tenantId, name: tenant.name, tenantType: tenant.tenantType }
      return successResult(tenant.tenantId, `Tenant "${tenant.name}" created.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {
    // Tenant creation seeds roles + first identity atomically-ish; no safe automatic rollback, mirrors CreateOrganizationAction.
  }

  audit(args: CreateTenantArgs, ctx: ActionContext, result: ActionResult<CreateTenantData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { name: args.name, tenantType: args.tenantType },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new CreateTenantAction())
