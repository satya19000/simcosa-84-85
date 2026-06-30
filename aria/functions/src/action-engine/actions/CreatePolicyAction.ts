import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireStringMax, optionalString, requireOneOf, requireString } from '../Validation'
import { ExecutionError } from '../Errors'
import { getSecurityEngine } from '../../security'
import { PERMISSION_ACTIONS } from '../../security/SecurityTypes'
import type { PermissionAction, PolicyResult } from '../../security/SecurityTypes'

const POLICY_RESULTS: PolicyResult[] = ['allow', 'deny', 'requireApproval', 'requireElevatedRole', 'auditOnly']

export interface CreatePolicyArgs {
  tenantId: string
  name: string
  description: string
  action: PermissionAction
  result: PolicyResult
  requiredRole?: string
}

export interface CreatePolicyData {
  policyId: string
  name: string
  result: PolicyResult
}

/** Thin wrapper around SecurityEngine.createPolicy — no raw Firestore writes here. */
export class CreatePolicyAction implements BaseAction<CreatePolicyArgs, CreatePolicyData> {
  readonly toolName = 'createPolicy'

  validate(args: CreatePolicyArgs): void {
    requireStringMax(args.tenantId, 'tenantId', 200)
    requireStringMax(args.name, 'name', 200)
    requireString(args.description, 'description')
    requireOneOf(args.action, 'action', PERMISSION_ACTIONS)
    requireOneOf(args.result, 'result', POLICY_RESULTS)
    optionalString(args.requiredRole, 'requiredRole')
  }

  async execute(args: CreatePolicyArgs, ctx: ActionContext): Promise<ActionResult<CreatePolicyData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getSecurityEngine(ctx.userId, ctx.db, apiKey)
      const policy = await engine.createPolicy(ctx.userId, args.tenantId, {
        name: args.name,
        description: args.description,
        action: args.action,
        result: args.result,
        requiredRole: args.requiredRole ?? null,
      })
      const data: CreatePolicyData = { policyId: policy.policyId, name: policy.name, result: policy.result }
      return successResult(policy.policyId, `Policy "${policy.name}" created.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {
    // Policy creation has no automatic safe rollback; best-effort no-op.
  }

  audit(args: CreatePolicyArgs, ctx: ActionContext, result: ActionResult<CreatePolicyData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { tenantId: args.tenantId, name: args.name, action: args.action, result: args.result },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new CreatePolicyAction())
