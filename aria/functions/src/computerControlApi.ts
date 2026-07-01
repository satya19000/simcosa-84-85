import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { getComputerControlEngine } from './computer-control'
import type { ComputerCapabilityId, ComputerApprovalInput } from './computer-control/ComputerTypes'
import type { DownloadApprovalInput } from './computer-control/ComputerExecutionTypes'

const SHARED_OPTS = {
  secrets: ['ANTHROPIC_API_KEY'],
  timeoutSeconds: 30,
}

function db(): admin.firestore.Firestore {
  return admin.firestore()
}

function apiKey(): string {
  return process.env.ANTHROPIC_API_KEY ?? ''
}

function requireAuth(request: { auth?: { uid: string } | null }): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.')
  return request.auth.uid
}

function wrapError<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch((err) => {
    const message = err instanceof Error ? err.message : 'Operation failed'
    if (message.includes('Access denied') || message.includes('no identity')) {
      throw new HttpsError('permission-denied', message)
    }
    if (message.includes('unconditionally blocked') || message.includes('CREDENTIAL_ACCESS_BLOCKED') || message.includes('ALWAYS BLOCKED')) {
      throw new HttpsError('permission-denied', message)
    }
    throw new HttpsError('failed-precondition', message)
  })
}

// ── Capability listing ─────────────────────────────────────────────────────

export const listComputerCapabilities = onCall(SHARED_OPTS, async (request) => {
  requireAuth(request)
  const engine = getComputerControlEngine(request.auth!.uid, db(), apiKey())
  return engine.listCapabilities()
})

// ── Planning ───────────────────────────────────────────────────────────────

export const planComputerAction = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, intent, manualSteps } = request.data as {
    tenantId: string
    intent: string
    manualSteps?: Array<{ capabilityId: ComputerCapabilityId; description: string; parameters?: Record<string, unknown> }>
  }
  if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  if (!intent?.trim()) throw new HttpsError('invalid-argument', 'intent required')
  const engine = getComputerControlEngine(uid, db(), apiKey())
  return wrapError(() => engine.planAction(uid, tenantId, intent, manualSteps))
})

// ── Approval ───────────────────────────────────────────────────────────────

export const requestComputerApproval = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const input = request.data as ComputerApprovalInput
  if (!input.tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  if (!input.capabilityId) throw new HttpsError('invalid-argument', 'capabilityId required')
  const engine = getComputerControlEngine(uid, db(), apiKey())
  return wrapError(() => engine.requestApproval({ ...input, userId: uid }))
})

// ── Local agent ─────────────────────────────────────────────────────────────

export const registerLocalAgent = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, deviceId, publicKey, capabilityGrant } = request.data as {
    tenantId: string
    deviceId: string
    publicKey: string
    capabilityGrant: ComputerCapabilityId[]
  }
  if (!tenantId || !deviceId || !publicKey) throw new HttpsError('invalid-argument', 'tenantId, deviceId, publicKey required')
  const engine = getComputerControlEngine(uid, db(), apiKey())
  return wrapError(() => engine.registerLocalAgent(tenantId, uid, { deviceId, publicKey, capabilityGrant: capabilityGrant ?? [] }))
})

export const revokeLocalAgent = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, agentId } = request.data as { tenantId: string; agentId: string }
  if (!tenantId || !agentId) throw new HttpsError('invalid-argument', 'tenantId and agentId required')
  const engine = getComputerControlEngine(uid, db(), apiKey())
  return wrapError(() => engine.revokeLocalAgent(tenantId, uid, agentId))
})

export const listLocalAgents = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId } = request.data as { tenantId: string }
  if (!tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
  const engine = getComputerControlEngine(uid, db(), apiKey())
  return wrapError(() => engine.listLocalAgents(tenantId, uid))
})

// ── Browser extension ──────────────────────────────────────────────────────

export const registerBrowserExtension = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, browserName, version, grantedCapabilities } = request.data as {
    tenantId: string
    browserName: string
    version: string
    grantedCapabilities: ComputerCapabilityId[]
  }
  if (!tenantId || !browserName || !version) throw new HttpsError('invalid-argument', 'tenantId, browserName, version required')
  const engine = getComputerControlEngine(uid, db(), apiKey())
  return wrapError(() => engine.registerBrowserExtension(tenantId, uid, { browserName, version, grantedCapabilities: grantedCapabilities ?? [] }))
})

export const revokeBrowserExtension = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, extensionId } = request.data as { tenantId: string; extensionId: string }
  if (!tenantId || !extensionId) throw new HttpsError('invalid-argument', 'tenantId and extensionId required')
  const engine = getComputerControlEngine(uid, db(), apiKey())
  return wrapError(() => engine.revokeBrowserExtension(tenantId, uid, extensionId))
})

export const listBrowserExtensions = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId } = request.data as { tenantId: string }
  if (!tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
  const engine = getComputerControlEngine(uid, db(), apiKey())
  return wrapError(() => engine.listBrowserExtensions(tenantId, uid))
})

// ── Audit / logging ────────────────────────────────────────────────────────

// ── Phase 5.6: Execute Approved Action ────────────────────────────────────────

/**
 * executeApprovedComputerAction — execute a pre-approved single action step.
 * Validates the approval record via ComputerExecutionValidator before calling
 * the provider through the full pipeline (safety → approval → provider).
 * Requires auth + tenant membership.
 */
export const executeApprovedComputerAction = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, plan, step, approvalRequestId, documentContext } = request.data as {
    tenantId: string
    plan: Parameters<ReturnType<typeof getComputerControlEngine>['executePipelineStep']>[2]['plan']
    step: Parameters<ReturnType<typeof getComputerControlEngine>['executePipelineStep']>[2]['step']
    approvalRequestId?: string
    documentContext?: unknown
  }
  if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  if (!plan?.planId) throw new HttpsError('invalid-argument', 'plan with planId required')
  if (!step?.capabilityId) throw new HttpsError('invalid-argument', 'step with capabilityId required')
  const engine = getComputerControlEngine(uid, db(), apiKey())
  return wrapError(() =>
    engine.executePipelineStep(tenantId, uid, {
      tenantId,
      userId: uid,
      plan,
      step,
      approvalRequestId,
      documentContext: documentContext as undefined,
    })
  )
})

// ── Phase 5.6: Analyze Selected Document ──────────────────────────────────────

/**
 * analyzeSelectedDocument — user sends file content (already picked via browser
 * file picker); routes through ComputerDocumentBridge → AI Gateway for summary
 * and action items. Requires auth + tenant membership.
 *
 * SAFETY: File content is base64-encoded by the front-end from a user-selected
 * file via <input type="file">. No server-side file system access occurs.
 * File content is NOT persisted — only metadata and analysis results are stored.
 */
export const analyzeSelectedDocument = onCall({ ...SHARED_OPTS, timeoutSeconds: 60 }, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, fileName, fileType, fileContentBase64, fileSizeBytes } = request.data as {
    tenantId: string
    fileName: string
    fileType: string
    fileContentBase64: string
    fileSizeBytes: number
  }
  if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  if (!fileName?.trim()) throw new HttpsError('invalid-argument', 'fileName required')
  if (!fileType?.trim()) throw new HttpsError('invalid-argument', 'fileType required')
  if (!fileContentBase64?.trim()) throw new HttpsError('invalid-argument', 'fileContentBase64 required')
  if (typeof fileSizeBytes !== 'number' || fileSizeBytes <= 0) {
    throw new HttpsError('invalid-argument', 'fileSizeBytes must be a positive number')
  }
  const engine = getComputerControlEngine(uid, db(), apiKey())
  return wrapError(() =>
    engine.analyzeDocument(tenantId, uid, {
      fileName,
      fileType,
      fileContentBase64,
      fileSizeBytes,
      // AI summary: Phase 5.7 will integrate the full AI Gateway pipeline here.
      // For now, structural analysis only.
      aiSummary: undefined,
      aiActionItems: undefined,
    })
  )
})

// ── Phase 5.6: Generate Computer Action Summary ────────────────────────────────

/**
 * generateComputerActionSummary — returns a human-readable summary of a
 * proposed action plan. Requires auth.
 * Phase 5.7 will route this through AI Gateway for a natural-language summary.
 */
export const generateComputerActionSummary = onCall(SHARED_OPTS, async (request) => {
  requireAuth(request)
  const { plan } = request.data as {
    plan: { planId: string; intent: string; steps: Array<{ capabilityId: string; riskLevel: string; description: string }> }
  }
  if (!plan?.planId) throw new HttpsError('invalid-argument', 'plan with planId required')

  // Structural summary without AI Gateway (Phase 5.7 will add LLM-based summary)
  const stepSummaries = (plan.steps ?? []).map(
    (s, i) => `Step ${i + 1}: ${s.description} [${s.capabilityId}, risk: ${s.riskLevel}]`
  )
  return {
    planId: plan.planId,
    intent: plan.intent,
    summary: `Plan "${plan.intent}" has ${plan.steps?.length ?? 0} step(s): ${stepSummaries.join(' → ')}`,
    stepCount: plan.steps?.length ?? 0,
    aiGatewayUsed: false,  // Phase 5.7 will set this to true
    _note: 'Full AI Gateway summarization is deferred to Phase 5.7.',
  }
})

// ── Phase 5.6: Get Computer Audit Feed ────────────────────────────────────────

/**
 * getComputerAuditFeed — returns paginated audit events from
 * tenants/{tenantId}/computerAudit ordered by timestamp desc.
 * Requires auth + tenant membership.
 */
export const getComputerAuditFeed = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, limit, beforeTimestamp } = request.data as {
    tenantId: string
    limit?: number
    beforeTimestamp?: string
  }
  if (!tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  const engine = getComputerControlEngine(uid, db(), apiKey())
  return wrapError(() =>
    engine.getAuditFeed(tenantId, uid, limit ?? 25, beforeTimestamp)
  )
})

// ── Phase 5.6: Download Generated File with Approval ─────────────────────────

/**
 * downloadGeneratedFileWithApproval — triggers ComputerDownloadManager with
 * an existing approval record. Requires auth + tenant membership.
 *
 * The approval record must already exist and be in 'approved' status.
 * The actual file transfer happens browser-side; this function verifies
 * approval and records the audit event.
 */
export const downloadGeneratedFileWithApproval = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const input = request.data as DownloadApprovalInput
  if (!input.tenantId?.trim()) throw new HttpsError('invalid-argument', 'tenantId required')
  if (!input.approvalRequestId?.trim()) throw new HttpsError('invalid-argument', 'approvalRequestId required')
  if (!input.fileName?.trim()) throw new HttpsError('invalid-argument', 'fileName required')
  if (!input.fileType?.trim()) throw new HttpsError('invalid-argument', 'fileType required')
  const engine = getComputerControlEngine(uid, db(), apiKey())
  return wrapError(() =>
    engine.downloadWithApproval(input.tenantId, uid, { ...input, userId: uid })
  )
})

// ── Audit / logging ────────────────────────────────────────────────────────

export const logComputerActionResult = onCall(SHARED_OPTS, async (request) => {
  const uid = requireAuth(request)
  const { tenantId, planId, capabilityId, success, metadata } = request.data as {
    tenantId: string
    planId: string
    capabilityId: ComputerCapabilityId
    success: boolean
    metadata?: Record<string, unknown>
  }
  if (!tenantId || !planId || !capabilityId) {
    throw new HttpsError('invalid-argument', 'tenantId, planId, capabilityId required')
  }
  const engine = getComputerControlEngine(uid, db(), apiKey())
  return wrapError(() => engine.logActionResult(tenantId, uid, planId, capabilityId, success, metadata ?? {}))
})
