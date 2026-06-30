import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { getApprovalEngine } from './delegation'
import type {
  ApprovalActionDescriptor, ApprovalLevel, ApprovalStatus, ApprovalTriggerType, RiskFactors,
} from './delegation/ApprovalTypes'

function db(): admin.firestore.Firestore {
  return admin.firestore()
}

function apiKey(): string {
  return process.env.ANTHROPIC_API_KEY ?? ''
}

// ── Creation ──────────────────────────────────────────────────────────────────

export const createApprovalRequest = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const data = request.data as {
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
    if (!data?.title || !data?.triggerType || !data?.riskFactors) {
      throw new HttpsError('invalid-argument', 'title, triggerType, and riskFactors are required')
    }
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.createApprovalRequest(request.auth.uid, { ...data, createdBy: request.auth.uid })
  }
)

export const getApprovalRequest = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestId } = request.data as { requestId: string }
    if (!requestId) throw new HttpsError('invalid-argument', 'requestId required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.getApprovalRequest(request.auth.uid, requestId)
  }
)

export const listApprovalRequests = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const opts = (request.data ?? {}) as { status?: ApprovalStatus; approvalLevel?: ApprovalLevel; triggerType?: ApprovalTriggerType; search?: string }
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.listAll(request.auth.uid, opts)
  }
)

export const listPendingApprovals = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.listPending(request.auth.uid)
  }
)

export const listUrgentApprovals = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.listUrgent(request.auth.uid)
  }
)

export const listExpiredApprovals = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.listExpired(request.auth.uid)
  }
)

export const listExecutedApprovals = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.listExecuted(request.auth.uid)
  }
)

export const listDelegatedApprovals = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.listDelegated(request.auth.uid)
  }
)

export const listRejectedApprovals = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.listRejected(request.auth.uid)
  }
)

// ── Decisions ─────────────────────────────────────────────────────────────────

export const approveRequest = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestId } = request.data as { requestId: string }
    if (!requestId) throw new HttpsError('invalid-argument', 'requestId required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.approveRequest(request.auth.uid, requestId, request.auth.uid)
  }
)

export const rejectRequest = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestId, reason } = request.data as { requestId: string; reason?: string }
    if (!requestId) throw new HttpsError('invalid-argument', 'requestId required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.rejectRequest(request.auth.uid, requestId, request.auth.uid, reason)
  }
)

export const cancelRequest = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestId, reason } = request.data as { requestId: string; reason?: string }
    if (!requestId) throw new HttpsError('invalid-argument', 'requestId required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.cancelRequest(request.auth.uid, requestId, request.auth.uid, reason)
  }
)

export const delegateRequest = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestId, delegatedTo } = request.data as { requestId: string; delegatedTo: string }
    if (!requestId || !delegatedTo) throw new HttpsError('invalid-argument', 'requestId and delegatedTo required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.delegateRequest(request.auth.uid, requestId, delegatedTo, request.auth.uid)
  }
)

export const bulkApproveRequests = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestIds } = request.data as { requestIds: string[] }
    if (!requestIds?.length) throw new HttpsError('invalid-argument', 'requestIds required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.bulkApprove(request.auth.uid, requestIds, request.auth.uid)
  }
)

export const bulkRejectRequests = onCall(
  { timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestIds, reason } = request.data as { requestIds: string[]; reason?: string }
    if (!requestIds?.length) throw new HttpsError('invalid-argument', 'requestIds required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.bulkReject(request.auth.uid, requestIds, request.auth.uid, reason)
  }
)

export const rollbackApprovalRequest = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestId } = request.data as { requestId: string }
    if (!requestId) throw new HttpsError('invalid-argument', 'requestId required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.rollbackRequest(request.auth.uid, requestId, request.auth.uid)
  }
)

// ── Stats / Metrics / Policy ───────────────────────────────────────────────────

export const getApprovalStats = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.getStats(request.auth.uid)
  }
)

export const getApprovalMetrics = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.getMetrics(request.auth.uid)
  }
)

export const getApprovalPolicyBands = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.getPolicyBands()
  }
)

export const listApprovalTemplates = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.listTemplates()
  }
)

// ── History / Scheduler ─────────────────────────────────────────────────────

export const listApprovalHistory = onCall(
  { timeoutSeconds: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { requestId } = (request.data ?? {}) as { requestId?: string }
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.listHistory(request.auth.uid, requestId)
  }
)

export const runApprovalScheduledChecks = onCall(
  { timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const engine = getApprovalEngine(request.auth.uid, db(), apiKey())
    return engine.runScheduledChecks(request.auth.uid)
  }
)
