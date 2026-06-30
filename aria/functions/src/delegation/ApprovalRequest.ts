import { v4 as uuidv4 } from 'uuid'
import type { ApprovalConfig } from './ApprovalConfig'
import type {
  ApprovalActionDescriptor, ApprovalLevel, ApprovalRequest, ApprovalStatus,
  ApprovalTriggerType, RiskFactors,
} from './ApprovalTypes'

/** Computes a 0-100 risk score from weighted RiskFactors. */
export function computeRiskScore(factors: RiskFactors): number {
  let score = 0
  if (factors.externalCommunication) score += 20
  score += Math.max(0, Math.min(1, factors.financialImpact)) * 30
  if (factors.healthImpact) score += 25
  if (factors.privacyImpact) score += 15
  if (factors.irreversible) score += 20
  // Low AI confidence increases risk — confidence 1.0 contributes 0, confidence 0 contributes 15.
  score += (1 - Math.max(0, Math.min(1, factors.aiConfidence))) * 15
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function riskScoreToLevel(score: number): ApprovalRequest['riskLevel'] {
  if (score >= 80) return 'critical'
  if (score >= 50) return 'high'
  if (score >= 20) return 'medium'
  return 'low'
}

export interface BuildApprovalRequestInput {
  userId: string
  title: string
  summary: string
  reason: string
  triggerType: ApprovalTriggerType
  actions: ApprovalActionDescriptor[]
  rollbackPlan: string
  estimatedDurationMs: number
  createdBy: string
  riskFactors: RiskFactors
  approvalLevel: ApprovalLevel
  workflowId?: string
  status?: ApprovalStatus
  expiresInMs?: number
}

/** Factory building a well-formed ApprovalRequest with a computed risk score. */
export function buildApprovalRequest(input: BuildApprovalRequestInput, config: ApprovalConfig): ApprovalRequest {
  const now = new Date()
  const riskScore = computeRiskScore(input.riskFactors)
  const expiresAt = new Date(now.getTime() + (input.expiresInMs ?? config.defaultExpiryMs)).toISOString()
  return {
    id: uuidv4(),
    userId: input.userId,
    title: input.title,
    summary: input.summary,
    reason: input.reason,
    riskLevel: riskScoreToLevel(riskScore),
    riskScore,
    aiConfidence: input.riskFactors.aiConfidence,
    workflowId: input.workflowId,
    actions: input.actions,
    rollbackPlan: input.rollbackPlan,
    estimatedDurationMs: input.estimatedDurationMs,
    createdBy: input.createdBy,
    createdAt: now.toISOString(),
    expiresAt,
    status: input.status ?? 'pending',
    triggerType: input.triggerType,
    approvalLevel: input.approvalLevel,
    history: [
      {
        id: uuidv4(),
        action: 'created',
        actor: input.createdBy,
        at: now.toISOString(),
      },
    ],
    updatedAt: now.toISOString(),
  }
}

/** Small builder class alternative to the factory function, for fluent construction. */
export class ApprovalRequestBuilder {
  private input: Partial<BuildApprovalRequestInput> = {}

  withUser(userId: string, createdBy: string): this {
    this.input.userId = userId
    this.input.createdBy = createdBy
    return this
  }

  withContent(title: string, summary: string, reason: string): this {
    this.input.title = title
    this.input.summary = summary
    this.input.reason = reason
    return this
  }

  withTrigger(triggerType: ApprovalTriggerType, approvalLevel: ApprovalLevel): this {
    this.input.triggerType = triggerType
    this.input.approvalLevel = approvalLevel
    return this
  }

  withActions(actions: ApprovalActionDescriptor[]): this {
    this.input.actions = actions
    return this
  }

  withRollback(rollbackPlan: string, estimatedDurationMs = 0): this {
    this.input.rollbackPlan = rollbackPlan
    this.input.estimatedDurationMs = estimatedDurationMs
    return this
  }

  withRiskFactors(riskFactors: RiskFactors): this {
    this.input.riskFactors = riskFactors
    return this
  }

  withWorkflow(workflowId: string): this {
    this.input.workflowId = workflowId
    return this
  }

  withStatus(status: ApprovalStatus): this {
    this.input.status = status
    return this
  }

  withExpiry(expiresInMs: number): this {
    this.input.expiresInMs = expiresInMs
    return this
  }

  build(config: ApprovalConfig): ApprovalRequest {
    const required = ['userId', 'createdBy', 'title', 'summary', 'reason', 'triggerType', 'approvalLevel', 'actions', 'rollbackPlan', 'riskFactors'] as const
    for (const key of required) {
      if (this.input[key] === undefined) throw new Error(`ApprovalRequestBuilder: missing required field "${key}"`)
    }
    return buildApprovalRequest(this.input as BuildApprovalRequestInput, config)
  }
}
