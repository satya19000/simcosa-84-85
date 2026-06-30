import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireStringMax, optionalString, requireBoolean } from '../Validation'
import { ExecutionError, ValidationError } from '../Errors'
import { getSecurityEngine } from '../../security'
import type { PolicyResult } from '../../security/SecurityTypes'

const POLICY_RESULTS: PolicyResult[] = ['allow', 'deny', 'requireApproval', 'requireElevatedRole', 'auditOnly']

export interface UpdatePolicyArgs {
  tenantId: string
  policyId: string
  name?: string
  description?: string
  result?: PolicyResult
  requiredRole?: string
  enabled?: boolean
}

export interface UpdatePolicyData {
  policyId: string
  result: PolicyResult
  enabled: boolean
}

/** Thin wrapper around SecurityEngine.updatePolicy — no raw Firestore writes here. */
export class UpdatePolicyAction implements BaseAction<UpdatePolicyArgs, UpdatePolicyData> {
  readonly toolName = 'updatePolicy'

  validate(args: UpdatePolicyArgs): void {
    requireStringMax(args.tenantId, 'tenantId', 200)
    requireStringMax(args.policyId, 'policyId', 200)
    optionalString(args.name, 'name')
    optionalString(args.description, 'description')
    if (args.result !== undefined && !POLICY_RESULTS.includes(args.result)) {
      throw new ValidationError('result', `must be one of: ${POLICY_RESULTS.join(', ')}`)
    }
    optionalString(args.requiredRole, 'requiredRole')
    if (args.enabled !== undefined) requireBoolean(args.enabled, 'enabled')
  }

  async execute(args: UpdatePolicyArgs, ctx: ActionContext): Promise<ActionResult<UpdatePolicyData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getSecurityEngine(ctx.userId, ctx.db, apiKey)
      const updated = await engine.updatePolicy(ctx.userId, args.tenantId, args.policyId, {
        name: args.name,
        description: args.description,
        result: args.result,
        requiredRole: args.requiredRole,
        enabled: args.enabled,
      })
      if (!updated) {
        const data: UpdatePolicyData = { policyId: args.policyId, result: 'deny', enabled: false }
        return successResult(args.policyId, 'Policy not found.', data, elapsedMs(ctx))
      }
      const data: UpdatePolicyData = { policyId: updated.policyId, result: updated.result, enabled: updated.enabled }
      return successResult(updated.policyId, `Policy "${updated.name}" updated.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {
    // Policy update has no automatic safe rollback (prior values not tracked here); best-effort no-op.
  }

  audit(args: UpdatePolicyArgs, ctx: ActionContext, result: ActionResult<UpdatePolicyData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { tenantId: args.tenantId, policyId: args.policyId },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new UpdatePolicyAction())
