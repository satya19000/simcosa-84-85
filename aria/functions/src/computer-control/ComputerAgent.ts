import type { ComputerActionPlan, ComputerCapabilityId } from './ComputerTypes'
import type { ComputerActionPlanner } from './ComputerActionPlanner'
import type { ComputerActionExecutor } from './ComputerActionExecutor'
import type { ComputerApprovalBridge } from './ComputerApprovalBridge'
import type { ComputerAudit } from './ComputerAudit'
import type { ComputerCapabilityRegistry } from './ComputerCapabilityRegistry'

/**
 * ComputerAgent — the main orchestrator for computer-control sessions.
 *
 * This agent NEVER executes computer actions directly. It:
 * 1. Accepts user intent
 * 2. Delegates to ComputerActionPlanner to produce a proposed plan
 * 3. Presents the plan for user review and approval
 * 4. Delegates to ComputerActionExecutor ONLY after approval
 *
 * Integration points (not fully implemented in Phase 5.5):
 * - Mission Control / Workflow Engine: plans can be embedded in workflows
 * - Plugin Framework: providers can be registered as plugins
 * - Marketplace: agents can be published as marketplace skills
 * - Observability: all events are audited via ComputerAudit
 * - Document Intelligence (aria/functions/src/documents): used for
 *   summarizeVisiblePage / readVisiblePage content pipeline
 */
export class ComputerAgent {
  constructor(
    private readonly planner: ComputerActionPlanner,
    private readonly executor: ComputerActionExecutor,
    private readonly approvalBridge: ComputerApprovalBridge,
    private readonly audit: ComputerAudit,
    private readonly capabilityRegistry: ComputerCapabilityRegistry
  ) {}

  /**
   * Produce a proposed plan from a user intent string.
   * Does NOT execute. Returns the plan for display and user approval.
   */
  async proposeAction(
    userId: string,
    tenantId: string,
    intent: string,
    manualSteps?: Array<{ capabilityId: ComputerCapabilityId; description: string; parameters?: Record<string, unknown> }>
  ): Promise<ComputerActionPlan> {
    const plan = await this.planner.planFromIntent(userId, tenantId, intent, manualSteps)
    await this.audit.record({
      tenantId,
      userId,
      eventType: 'action.planned',
      planId: plan.planId,
      riskLevel: plan.overallRiskLevel,
      metadata: { stepCount: plan.steps.length, intent: intent.slice(0, 100) },
    })
    return plan
  }

  /**
   * Request approval for a medium/high/critical step via ComputerApprovalBridge.
   * Returns the approvalRequestId for the caller to track.
   */
  async requestApprovalForStep(
    plan: ComputerActionPlan,
    stepIndex: number
  ): Promise<string> {
    const step = plan.steps[stepIndex]
    if (!step) throw new Error(`Step ${stepIndex} not found in plan ${plan.planId}`)

    const approval = await this.approvalBridge.requestApproval({
      userId: plan.userId,
      tenantId: plan.tenantId,
      planId: plan.planId,
      stepIndex,
      capabilityId: step.capabilityId,
      riskLevel: step.riskLevel,
      description: step.description,
      reason: `Computer action plan "${plan.intent}" — step ${stepIndex + 1}: ${step.description}`,
      irreversible: !step.reversible,
      parameters: step.parameters,
    })

    await this.audit.record({
      tenantId: plan.tenantId,
      userId: plan.userId,
      eventType: 'approval.requested',
      capabilityId: step.capabilityId,
      planId: plan.planId,
      approvalRequestId: approval.id,
      riskLevel: step.riskLevel,
      metadata: { stepIndex },
    })

    return approval.id
  }

  /**
   * Execute a single approved step. Approval must already be granted.
   * ComputerActionExecutor enforces all safety/permission/approval checks.
   */
  async executeApprovedStep(
    plan: ComputerActionPlan,
    stepIndex: number,
    approvalRequestId?: string
  ) {
    const step = plan.steps[stepIndex]
    if (!step) throw new Error(`Step ${stepIndex} not found in plan ${plan.planId}`)
    return this.executor.executeStep(plan.tenantId, plan.userId, plan, step, approvalRequestId)
  }

  /** List all known capabilities. */
  listCapabilities() {
    return this.capabilityRegistry.getAll()
  }
}
