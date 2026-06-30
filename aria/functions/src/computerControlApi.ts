import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { getComputerControlEngine } from './computer-control'
import type { ComputerCapabilityId, ComputerApprovalInput } from './computer-control/ComputerTypes'

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
