import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { getOrganizationEngine } from './organization'
import { WorkspaceValidator, WorkspaceValidationError } from './organization/WorkspaceValidator'
import type { MemberRole, OrganizationType } from './organization/WorkspaceTypes'
import type { ApprovalActionDescriptor, ApprovalTriggerType, RiskFactors } from './delegation/ApprovalTypes'

function db(): admin.firestore.Firestore {
  return admin.firestore()
}

function apiKey(): string {
  return process.env.ANTHROPIC_API_KEY ?? ''
}

function requireAuth(request: { auth?: { uid: string; token?: { name?: string; email?: string } } | null }): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
  return request.auth.uid
}

function wrapValidation<T>(fn: () => T): T {
  try {
    return fn()
  } catch (err) {
    if (err instanceof WorkspaceValidationError) throw new HttpsError('invalid-argument', err.message)
    throw err
  }
}

function wrapEngineError<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch((err) => {
    const message = err instanceof Error ? err.message : 'Operation failed'
    if (message.includes('Access denied')) throw new HttpsError('permission-denied', message)
    throw new HttpsError('failed-precondition', message)
  })
}

// ── Organizations ────────────────────────────────────────────────────────────

export const createOrganization = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 },
  async (request) => {
    const uid = requireAuth(request)
    const data = request.data as { name: string; type: OrganizationType; description?: string }
    wrapValidation(() => WorkspaceValidator.validateCreateOrganization(data))
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return engine.createOrganization(uid, data)
  }
)

export const getOrganization = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId } = request.data as { organizationId: string }
    if (!organizationId) throw new HttpsError('invalid-argument', 'organizationId required')
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.getOrganization(uid, organizationId))
  }
)

export const updateOrganization = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId, ...fields } = request.data as { organizationId: string; name?: string; description?: string; type?: OrganizationType }
    if (!organizationId) throw new HttpsError('invalid-argument', 'organizationId required')
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.updateOrganization(uid, organizationId, fields))
  }
)

export const listMyOrganizations = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { candidateOrganizationIds } = (request.data ?? {}) as { candidateOrganizationIds?: string[] }
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return engine.listMyOrganizations(uid, candidateOrganizationIds ?? [])
  }
)

// ── Workspaces ────────────────────────────────────────────────────────────────

export const createWorkspace = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const data = request.data as { organizationId: string; name: string; description?: string }
    wrapValidation(() => WorkspaceValidator.validateCreateWorkspace(data))
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.createWorkspace(uid, data.organizationId, data))
  }
)

export const getWorkspace = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId, workspaceId } = request.data as { organizationId: string; workspaceId: string }
    if (!organizationId || !workspaceId) throw new HttpsError('invalid-argument', 'organizationId and workspaceId required')
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.getWorkspace(uid, organizationId, workspaceId))
  }
)

export const listWorkspaces = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId } = request.data as { organizationId: string }
    if (!organizationId) throw new HttpsError('invalid-argument', 'organizationId required')
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.listWorkspaces(uid, organizationId))
  }
)

// ── Members ───────────────────────────────────────────────────────────────────

export const listMembers = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId } = request.data as { organizationId: string }
    if (!organizationId) throw new HttpsError('invalid-argument', 'organizationId required')
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.listMembers(uid, organizationId))
  }
)

export const removeMember = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId, memberId } = request.data as { organizationId: string; memberId: string }
    if (!organizationId || !memberId) throw new HttpsError('invalid-argument', 'organizationId and memberId required')
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.removeMember(uid, organizationId, memberId))
  }
)

export const changeMemberRole = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId, memberId, role } = request.data as { organizationId: string; memberId: string; role: MemberRole }
    if (!organizationId || !memberId || !role) throw new HttpsError('invalid-argument', 'organizationId, memberId, and role required')
    wrapValidation(() => WorkspaceValidator.validateRole(role))
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.changeMemberRole(uid, organizationId, memberId, role))
  }
)

// ── Invitations ───────────────────────────────────────────────────────────────

export const inviteMember = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const data = request.data as { organizationId: string; email: string; role: MemberRole; workspaceId?: string }
    wrapValidation(() => WorkspaceValidator.validateInvite(data))
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.inviteMember(uid, data.organizationId, data))
  }
)

export const listInvitations = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId } = request.data as { organizationId: string }
    if (!organizationId) throw new HttpsError('invalid-argument', 'organizationId required')
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.listInvitations(uid, organizationId))
  }
)

export const acceptInvitation = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId, invitationId } = request.data as { organizationId: string; invitationId: string }
    if (!organizationId || !invitationId) throw new HttpsError('invalid-argument', 'organizationId and invitationId required')
    const engine = getOrganizationEngine(uid, db(), apiKey())
    const profile = {
      displayName: request.auth?.token?.name ?? request.auth?.token?.email ?? 'New member',
      email: request.auth?.token?.email ?? '',
    }
    return wrapEngineError(() => engine.acceptInvitation(uid, organizationId, invitationId, profile))
  }
)

export const revokeInvitation = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId, invitationId } = request.data as { organizationId: string; invitationId: string }
    if (!organizationId || !invitationId) throw new HttpsError('invalid-argument', 'organizationId and invitationId required')
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.revokeInvitation(uid, organizationId, invitationId))
  }
)

// ── Activity feed / Announcements ──────────────────────────────────────────────

export const listActivity = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId, workspaceId } = request.data as { organizationId: string; workspaceId?: string }
    if (!organizationId) throw new HttpsError('invalid-argument', 'organizationId required')
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.listActivity(uid, organizationId, workspaceId))
  }
)

export const postAnnouncement = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const data = request.data as { organizationId: string; title: string; body: string; workspaceId?: string }
    wrapValidation(() => WorkspaceValidator.validateAnnouncement(data))
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.postAnnouncement(uid, data.organizationId, data))
  }
)

// ── Mission Control integration ────────────────────────────────────────────────

export const assignMissionToWorkspace = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId, workspaceId, missionId, assignedMemberIds } = request.data as {
      organizationId: string; workspaceId: string; missionId: string; assignedMemberIds: string[]
    }
    if (!organizationId || !workspaceId || !missionId || !assignedMemberIds?.length) {
      throw new HttpsError('invalid-argument', 'organizationId, workspaceId, missionId, and assignedMemberIds required')
    }
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.assignMissionToWorkspace(uid, organizationId, workspaceId, missionId, assignedMemberIds))
  }
)

export const listSharedMissions = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId, workspaceId } = request.data as { organizationId: string; workspaceId?: string }
    if (!organizationId) throw new HttpsError('invalid-argument', 'organizationId required')
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.listSharedMissions(uid, organizationId, workspaceId))
  }
)

// ── Team delegation (shared tasks) ────────────────────────────────────────────

export const delegateTask = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId, workspaceId, title, description, assignedTo } = request.data as {
      organizationId: string; workspaceId: string; title: string; description?: string; assignedTo?: string
    }
    if (!organizationId || !workspaceId || !title) throw new HttpsError('invalid-argument', 'organizationId, workspaceId, and title required')
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.delegateTask(uid, organizationId, workspaceId, { title, description, assignedTo }))
  }
)

export const listSharedTasks = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId, workspaceId } = request.data as { organizationId: string; workspaceId?: string }
    if (!organizationId) throw new HttpsError('invalid-argument', 'organizationId required')
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.listSharedTasks(uid, organizationId, workspaceId))
  }
)

// ── Shared approvals (via real ApprovalEngine only) ────────────────────────────

export const requestSharedApproval = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 },
  async (request) => {
    const uid = requireAuth(request)
    const data = request.data as {
      organizationId: string; taskId: string
      title: string; summary: string; reason: string
      triggerType: ApprovalTriggerType; actions: ApprovalActionDescriptor[]; rollbackPlan: string
      estimatedDurationMs?: number; riskFactors: RiskFactors; expiresInMs?: number
    }
    if (!data?.organizationId || !data?.taskId || !data?.title || !data?.triggerType || !data?.riskFactors) {
      throw new HttpsError('invalid-argument', 'organizationId, taskId, title, triggerType, and riskFactors are required')
    }
    const engine = getOrganizationEngine(uid, db(), apiKey())
    const { organizationId, taskId, ...approvalInput } = data
    return wrapEngineError(() => engine.requestApprovalForSharedTask(uid, organizationId, taskId, approvalInput))
  }
)

export const getSharedTaskApprovalStatus = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId, taskId } = request.data as { organizationId: string; taskId: string }
    if (!organizationId || !taskId) throw new HttpsError('invalid-argument', 'organizationId and taskId required')
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.getSharedTaskApprovalStatus(uid, organizationId, taskId))
  }
)

// ── Analytics ───────────────────────────────────────────────────────────────────

export const getOrganizationAnalytics = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { organizationId } = request.data as { organizationId: string }
    if (!organizationId) throw new HttpsError('invalid-argument', 'organizationId required')
    const engine = getOrganizationEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.getAnalytics(uid, organizationId))
  }
)
