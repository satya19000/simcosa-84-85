// ── Shared Approval / Delegation Types ──────────────────────────────────────

export type ApprovalStatus =
  | 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled'
  | 'expired' | 'delegated' | 'executed' | 'rolled_back'

export type ApprovalLevel = 'none' | 'simple' | 'standard' | 'manager' | 'executive' | 'emergency'

export type ApprovalTriggerType =
  | 'send_email' | 'send_whatsapp' | 'delete_documents' | 'delete_contacts'
  | 'delete_memories' | 'financial_payment' | 'medical_decision'
  | 'health_record_update' | 'bulk_operation' | 'external_api_call' | 'plugin_installation'

export interface ApprovalActionDescriptor {
  id: string
  description: string
  target?: string
  payload?: Record<string, unknown>
}

export interface ApprovalDecisionHistoryEntry {
  id: string
  action:
    | 'created' | 'approved' | 'rejected' | 'cancelled' | 'expired'
    | 'delegated' | 'executed' | 'rolled_back' | 'updated'
  actor: string
  notes?: string
  at: string
}

export interface ApprovalRequest {
  id: string
  userId: string
  title: string
  summary: string
  reason: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number // 0-100
  aiConfidence: number // 0-1
  workflowId?: string
  actions: ApprovalActionDescriptor[]
  rollbackPlan: string
  estimatedDurationMs: number
  createdBy: string
  createdAt: string
  expiresAt: string
  status: ApprovalStatus
  triggerType: ApprovalTriggerType
  approvalLevel: ApprovalLevel
  delegatedTo?: string
  executedAt?: string
  rolledBackAt?: string
  history: ApprovalDecisionHistoryEntry[]
  updatedAt: string
}

// Factors feeding the 0-100 risk score. Each is normalized 0-1 internally;
// see ApprovalPolicy for weighting and ApprovalRequest.ts for computation.
export interface RiskFactors {
  externalCommunication: boolean
  financialImpact: number // 0-1, magnitude of $ at stake (already normalized by caller)
  healthImpact: boolean
  privacyImpact: boolean
  irreversible: boolean
  aiConfidence: number // 0-1 — LOW confidence increases risk
}

export type ApprovalEventName =
  | 'approval:created' | 'approval:approved' | 'approval:rejected'
  | 'approval:cancelled' | 'approval:expired' | 'approval:executed'
  | 'approval:rolled_back' | 'approval:delegated' | 'approval:expiring'

export interface ApprovalEvent<T = unknown> {
  name: ApprovalEventName
  userId: string
  payload: T
  emittedAt: string
}

export type DelegationRole = 'reader' | 'approver' | 'manager' | 'executive' | 'admin'

export interface DelegationRule {
  id: string
  userId: string
  fromUserId: string
  toUserId: string
  scopeTriggerTypes: ApprovalTriggerType[]
  maxApprovalLevel: ApprovalLevel
  active: boolean
  createdAt: string
  expiresAt?: string
}

export interface ApprovalPermissionRecord {
  userId: string
  scopeId: string
  role: DelegationRole
  grantedAt: string
}
