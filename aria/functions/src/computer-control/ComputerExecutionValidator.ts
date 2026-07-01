import type { ComputerActionPlan, ComputerActionStep, ComputerCapabilityId } from './ComputerTypes'
import type { ComputerApprovalBridge } from './ComputerApprovalBridge'
import type { ComputerCapabilityRegistry } from './ComputerCapabilityRegistry'
import type { ValidationResult } from './ComputerExecutionTypes'

/**
 * ComputerExecutionValidator — validates an execution request BEFORE the
 * ComputerActionExecutor is called.
 *
 * Checks:
 * 1. Plan is in 'approved' status and matches the step
 * 2. If the step requires approval: approvalRequestId is present and in 'approved' status
 * 3. The capability has not been revoked (not in always-blocked set, not policy-blocked)
 *
 * This is an additional pre-execution gate integrated into ComputerActionExecutor.
 * It does NOT replace SafetyGuard or ApprovalBridge — it runs before them as a
 * precondition check.
 */
export class ComputerExecutionValidator {
  constructor(
    private readonly approvalBridge: ComputerApprovalBridge,
    private readonly capabilityRegistry: ComputerCapabilityRegistry
  ) {}

  async validate(
    userId: string,
    plan: ComputerActionPlan,
    step: ComputerActionStep,
    approvalRequestId?: string
  ): Promise<ValidationResult> {
    const errors: string[] = []

    // 1. Plan validity
    const planValid = this.validatePlan(plan, step, errors)

    // 2. Approval validity
    const approvalValid = await this.validateApproval(userId, step, approvalRequestId, errors)

    // 3. Capability not revoked / not always-blocked
    const capabilityNotRevoked = this.validateCapability(step.capabilityId, errors)

    const valid = planValid && approvalValid && capabilityNotRevoked

    return { valid, planValid, approvalValid, capabilityNotRevoked, errors }
  }

  private validatePlan(
    plan: ComputerActionPlan,
    step: ComputerActionStep,
    errors: string[]
  ): boolean {
    if (!plan.planId) {
      errors.push('Plan has no planId.')
      return false
    }
    if (plan.status !== 'approved' && plan.status !== 'executing') {
      errors.push(`Plan status is "${plan.status}" — plan must be in "approved" or "executing" status before executing any step.`)
      return false
    }
    const matchingStep = plan.steps.find((s) => s.stepIndex === step.stepIndex)
    if (!matchingStep) {
      errors.push(`Step index ${step.stepIndex} not found in plan ${plan.planId}.`)
      return false
    }
    if (matchingStep.capabilityId !== step.capabilityId) {
      errors.push(`Step capabilityId mismatch: plan has "${matchingStep.capabilityId}", request has "${step.capabilityId}".`)
      return false
    }
    return true
  }

  private async validateApproval(
    userId: string,
    step: ComputerActionStep,
    approvalRequestId: string | undefined,
    errors: string[]
  ): Promise<boolean> {
    if (!step.requiresApproval) {
      // Low-risk steps do not require an approval record
      return true
    }
    if (!approvalRequestId) {
      errors.push(`Step "${step.capabilityId}" requires an approvalRequestId but none was provided.`)
      return false
    }
    const approval = await this.approvalBridge.getApprovalStatus(userId, approvalRequestId)
    if (!approval) {
      errors.push(`Approval request "${approvalRequestId}" not found.`)
      return false
    }
    if (approval.status !== 'approved') {
      errors.push(`Approval request "${approvalRequestId}" is in status "${approval.status}" — must be "approved" to execute.`)
      return false
    }
    return true
  }

  private validateCapability(
    capabilityId: ComputerCapabilityId,
    errors: string[]
  ): boolean {
    const descriptor = this.capabilityRegistry.get(capabilityId)
    if (!descriptor) {
      errors.push(`Capability "${capabilityId}" is not registered.`)
      return false
    }
    if (descriptor.alwaysBlocked) {
      errors.push(`Capability "${capabilityId}" is unconditionally blocked by policy — cannot execute under any condition.`)
      return false
    }
    if (descriptor.policyBlocked) {
      errors.push(`Capability "${capabilityId}" is blocked by tenant policy.`)
      return false
    }
    return true
  }
}
