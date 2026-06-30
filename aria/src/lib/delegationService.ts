import { httpsCallable } from 'firebase/functions'
import { functions as fns } from './firebase'

const createApprovalRequestFn = httpsCallable(fns, 'createApprovalRequest')
const getApprovalRequestFn = httpsCallable(fns, 'getApprovalRequest')
const listApprovalRequestsFn = httpsCallable(fns, 'listApprovalRequests')
const listPendingApprovalsFn = httpsCallable(fns, 'listPendingApprovals')
const listUrgentApprovalsFn = httpsCallable(fns, 'listUrgentApprovals')
const listExpiredApprovalsFn = httpsCallable(fns, 'listExpiredApprovals')
const listExecutedApprovalsFn = httpsCallable(fns, 'listExecutedApprovals')
const listDelegatedApprovalsFn = httpsCallable(fns, 'listDelegatedApprovals')
const listRejectedApprovalsFn = httpsCallable(fns, 'listRejectedApprovals')
const approveRequestFn = httpsCallable(fns, 'approveRequest')
const rejectRequestFn = httpsCallable(fns, 'rejectRequest')
const cancelRequestFn = httpsCallable(fns, 'cancelRequest')
const delegateRequestFn = httpsCallable(fns, 'delegateRequest')
const bulkApproveRequestsFn = httpsCallable(fns, 'bulkApproveRequests')
const bulkRejectRequestsFn = httpsCallable(fns, 'bulkRejectRequests')
const rollbackApprovalRequestFn = httpsCallable(fns, 'rollbackApprovalRequest')
const getApprovalStatsFn = httpsCallable(fns, 'getApprovalStats')
const getApprovalMetricsFn = httpsCallable(fns, 'getApprovalMetrics')
const listApprovalHistoryFn = httpsCallable(fns, 'listApprovalHistory')
const runApprovalScheduledChecksFn = httpsCallable(fns, 'runApprovalScheduledChecks')
const listApprovalTemplatesFn = httpsCallable(fns, 'listApprovalTemplates')
const getApprovalPolicyBandsFn = httpsCallable(fns, 'getApprovalPolicyBands')

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
  action: string
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
  riskScore: number
  aiConfidence: number
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

export interface RiskFactors {
  externalCommunication: boolean
  financialImpact: number
  healthImpact: boolean
  privacyImpact: boolean
  irreversible: boolean
  aiConfidence: number
}

export interface ApprovalStats {
  total: number
  byStatus: Record<string, number>
  byLevel: Record<string, number>
  byTriggerType: Record<string, number>
  avgTimeToDecisionMs: number | null
  avgTimeToExecutionMs: number | null
  approvalRate: number
  rejectionRate: number
  expiryRate: number
  riskScoreDistribution: { low: number; medium: number; high: number; critical: number }
  delegationStats: { totalDelegated: number; uniqueDelegates: number }
}

export interface ApprovalMetricsSnapshot {
  totalApprovals: number
  totalPending: number
  totalApproved: number
  totalRejected: number
  totalExpired: number
  totalAutoExecuted: number
  totalExecuted: number
  totalRolledBack: number
  totalDelegated: number
}

export interface ApprovalHistoryEntry {
  id: string
  requestId: string
  action: string
  actor: string
  notes?: string
  details?: Record<string, unknown>
  at: string
}

export interface ApprovalTemplate {
  triggerType: ApprovalTriggerType
  titlePattern: string
  summaryPattern: string
  reasonPattern: string
  defaultRiskFactors: RiskFactors
  defaultApprovalLevel: ApprovalLevel
}

export interface ApprovalPolicyBands {
  autoExecuteThreshold: number
  simpleThreshold: number
  executiveThreshold: number
  alwaysManualTriggers: ApprovalTriggerType[]
}

export interface CreateApprovalRequestInput {
  title: string
  summary: string
  reason: string
  triggerType: ApprovalTriggerType
  actions: ApprovalActionDescriptor[]
  rollbackPlan: string
  estimatedDurationMs?: number
  riskFactors: RiskFactors
  workflowId?: string
  expiresInMs?: number
}

export async function createApprovalRequest(input: CreateApprovalRequestInput): Promise<ApprovalRequest> {
  const result = await createApprovalRequestFn(input)
  return result.data as ApprovalRequest
}

export async function getApprovalRequest(requestId: string): Promise<ApprovalRequest | null> {
  const result = await getApprovalRequestFn({ requestId })
  return result.data as ApprovalRequest | null
}

export async function listApprovalRequests(opts?: { status?: ApprovalStatus; approvalLevel?: ApprovalLevel; triggerType?: ApprovalTriggerType; search?: string }): Promise<ApprovalRequest[]> {
  const result = await listApprovalRequestsFn(opts ?? {})
  return result.data as ApprovalRequest[]
}

export async function listPendingApprovals(): Promise<ApprovalRequest[]> {
  const result = await listPendingApprovalsFn({})
  return result.data as ApprovalRequest[]
}

export async function listUrgentApprovals(): Promise<ApprovalRequest[]> {
  const result = await listUrgentApprovalsFn({})
  return result.data as ApprovalRequest[]
}

export async function listExpiredApprovals(): Promise<ApprovalRequest[]> {
  const result = await listExpiredApprovalsFn({})
  return result.data as ApprovalRequest[]
}

export async function listExecutedApprovals(): Promise<ApprovalRequest[]> {
  const result = await listExecutedApprovalsFn({})
  return result.data as ApprovalRequest[]
}

export async function listDelegatedApprovals(): Promise<ApprovalRequest[]> {
  const result = await listDelegatedApprovalsFn({})
  return result.data as ApprovalRequest[]
}

export async function listRejectedApprovals(): Promise<ApprovalRequest[]> {
  const result = await listRejectedApprovalsFn({})
  return result.data as ApprovalRequest[]
}

export async function approveRequest(requestId: string): Promise<ApprovalRequest | null> {
  const result = await approveRequestFn({ requestId })
  return result.data as ApprovalRequest | null
}

export async function rejectRequest(requestId: string, reason?: string): Promise<ApprovalRequest | null> {
  const result = await rejectRequestFn({ requestId, reason })
  return result.data as ApprovalRequest | null
}

export async function cancelRequest(requestId: string, reason?: string): Promise<ApprovalRequest | null> {
  const result = await cancelRequestFn({ requestId, reason })
  return result.data as ApprovalRequest | null
}

export async function delegateRequest(requestId: string, delegatedTo: string): Promise<ApprovalRequest | null> {
  const result = await delegateRequestFn({ requestId, delegatedTo })
  return result.data as ApprovalRequest | null
}

export async function bulkApproveRequests(requestIds: string[]): Promise<ApprovalRequest[]> {
  const result = await bulkApproveRequestsFn({ requestIds })
  return result.data as ApprovalRequest[]
}

export async function bulkRejectRequests(requestIds: string[], reason?: string): Promise<ApprovalRequest[]> {
  const result = await bulkRejectRequestsFn({ requestIds, reason })
  return result.data as ApprovalRequest[]
}

export async function rollbackApprovalRequest(requestId: string): Promise<ApprovalRequest | null> {
  const result = await rollbackApprovalRequestFn({ requestId })
  return result.data as ApprovalRequest | null
}

export async function getApprovalStats(): Promise<ApprovalStats> {
  const result = await getApprovalStatsFn({})
  return result.data as ApprovalStats
}

export async function getApprovalMetrics(): Promise<ApprovalMetricsSnapshot> {
  const result = await getApprovalMetricsFn({})
  return result.data as ApprovalMetricsSnapshot
}

export async function listApprovalHistory(requestId?: string): Promise<ApprovalHistoryEntry[]> {
  const result = await listApprovalHistoryFn(requestId ? { requestId } : {})
  return result.data as ApprovalHistoryEntry[]
}

export async function runApprovalScheduledChecks(): Promise<{ expiringNotified: number; expired: number }> {
  const result = await runApprovalScheduledChecksFn({})
  return result.data as { expiringNotified: number; expired: number }
}

export async function listApprovalTemplates(): Promise<ApprovalTemplate[]> {
  const result = await listApprovalTemplatesFn({})
  return result.data as ApprovalTemplate[]
}

export async function getApprovalPolicyBands(): Promise<ApprovalPolicyBands> {
  const result = await getApprovalPolicyBandsFn({})
  return result.data as ApprovalPolicyBands
}
