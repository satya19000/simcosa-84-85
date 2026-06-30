import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { getSecurityEngine } from './security'
import { SecurityValidator, SecurityValidationError } from './security/SecurityValidator'
import type {
  TenantType, IdentityType, RoleScope, PermissionAction, PolicyResult,
} from './security/SecurityTypes'

function db(): admin.firestore.Firestore {
  return admin.firestore()
}

function apiKey(): string {
  return process.env.ANTHROPIC_API_KEY ?? ''
}

function requireAuth(request: { auth?: { uid: string } | null }): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
  return request.auth.uid
}

function wrapValidation<T>(fn: () => T): T {
  try {
    return fn()
  } catch (err) {
    if (err instanceof SecurityValidationError) throw new HttpsError('invalid-argument', err.message)
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

// ── Tenants ─────────────────────────────────────────────────────────────────

export const createTenant = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 },
  async (request) => {
    const uid = requireAuth(request)
    const data = request.data as { name: string; tenantType: TenantType; organizationId?: string; plan?: 'free' | 'starter' | 'team' | 'enterprise' }
    wrapValidation(() => SecurityValidator.validateCreateTenant(data))
    const engine = getSecurityEngine(uid, db(), apiKey())
    return engine.createTenant(uid, data)
  }
)

export const getTenant = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId } = request.data as { tenantId: string }
    if (!tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.getTenant(uid, tenantId))
  }
)

export const listMyTenants = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const engine = getSecurityEngine(uid, db(), apiKey())
    return engine.listMyTenants(uid)
  }
)

// ── Identities ──────────────────────────────────────────────────────────────

export const createIdentity = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const data = request.data as { tenantId: string; type: IdentityType; userId?: string; organizationId?: string; workspaceId?: string; displayName: string; roles?: string[] }
    if (!data?.tenantId || !data?.displayName) throw new HttpsError('invalid-argument', 'tenantId and displayName required')
    wrapValidation(() => SecurityValidator.validateIdentityType(data.type))
    const engine = getSecurityEngine(uid, db(), apiKey())
    const { tenantId, ...rest } = data
    return wrapEngineError(() => engine.createIdentity(uid, tenantId, rest))
  }
)

export const listIdentities = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId } = request.data as { tenantId: string }
    if (!tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.listIdentities(uid, tenantId))
  }
)

// ── RBAC ────────────────────────────────────────────────────────────────────

export const checkPermission = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, action } = request.data as { tenantId: string; action: PermissionAction }
    if (!tenantId || !action) throw new HttpsError('invalid-argument', 'tenantId and action required')
    wrapValidation(() => SecurityValidator.validatePermissionAction(action))
    const engine = getSecurityEngine(uid, db(), apiKey())
    return engine.can(uid, tenantId, action)
  }
)

// ── Roles ───────────────────────────────────────────────────────────────────

export const createRole = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const data = request.data as { tenantId: string; name: string; scope: RoleScope; permissions: PermissionAction[]; inheritsFrom?: string }
    if (!data?.tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
    wrapValidation(() => SecurityValidator.validateCreateRole(data))
    const engine = getSecurityEngine(uid, db(), apiKey())
    const { tenantId, ...rest } = data
    return wrapEngineError(() => engine.createRole(uid, tenantId, rest))
  }
)

export const listRoles = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId } = request.data as { tenantId: string }
    if (!tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.listRoles(uid, tenantId))
  }
)

export const assignRole = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const data = request.data as { tenantId: string; identityId: string; roleId: string; scope: RoleScope; scopeId?: string; expiresAt?: string; delegatedBy?: string }
    if (!data?.tenantId || !data?.identityId || !data?.roleId || !data?.scope) {
      throw new HttpsError('invalid-argument', 'tenantId, identityId, roleId, and scope required')
    }
    const engine = getSecurityEngine(uid, db(), apiKey())
    const { tenantId, ...rest } = data
    return wrapEngineError(() => engine.assignRole(uid, tenantId, rest))
  }
)

export const revokeRoleAssignment = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, assignmentId } = request.data as { tenantId: string; assignmentId: string }
    if (!tenantId || !assignmentId) throw new HttpsError('invalid-argument', 'tenantId and assignmentId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.revokeRoleAssignment(uid, tenantId, assignmentId))
  }
)

// ── Policies ────────────────────────────────────────────────────────────────

export const createPolicy = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const data = request.data as { tenantId: string; name: string; description: string; action: PermissionAction; result: PolicyResult; requiredRole?: string }
    if (!data?.tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
    wrapValidation(() => SecurityValidator.validateCreatePolicy(data))
    const engine = getSecurityEngine(uid, db(), apiKey())
    const { tenantId, ...rest } = data
    return wrapEngineError(() => engine.createPolicy(uid, tenantId, rest))
  }
)

export const updatePolicy = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, policyId, ...fields } = request.data as { tenantId: string; policyId: string; name?: string; description?: string; result?: PolicyResult; requiredRole?: string | null; enabled?: boolean }
    if (!tenantId || !policyId) throw new HttpsError('invalid-argument', 'tenantId and policyId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.updatePolicy(uid, tenantId, policyId, fields))
  }
)

export const listPolicies = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId } = request.data as { tenantId: string }
    if (!tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.listPolicies(uid, tenantId))
  }
)

export const evaluatePolicy = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, action } = request.data as { tenantId: string; action: PermissionAction }
    if (!tenantId || !action) throw new HttpsError('invalid-argument', 'tenantId and action required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.evaluatePolicy(uid, tenantId, action))
  }
)

// ── Sessions ────────────────────────────────────────────────────────────────

export const createSession = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const data = request.data as { tenantId: string; identityId: string; deviceInfo?: string; browser?: string; ipAddress?: string; location?: string }
    if (!data?.tenantId || !data?.identityId) throw new HttpsError('invalid-argument', 'tenantId and identityId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    const { tenantId, ...rest } = data
    return wrapEngineError(() => engine.createSession(uid, tenantId, rest))
  }
)

export const refreshSession = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, sessionId } = request.data as { tenantId: string; sessionId: string }
    if (!tenantId || !sessionId) throw new HttpsError('invalid-argument', 'tenantId and sessionId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.refreshSession(uid, tenantId, sessionId))
  }
)

export const revokeSession = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, sessionId } = request.data as { tenantId: string; sessionId: string }
    if (!tenantId || !sessionId) throw new HttpsError('invalid-argument', 'tenantId and sessionId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.revokeSession(uid, tenantId, sessionId))
  }
)

export const listSessions = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, forUserId } = request.data as { tenantId: string; forUserId?: string }
    if (!tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.listSessions(uid, tenantId, forUserId))
  }
)

// ── Groups ──────────────────────────────────────────────────────────────────

export const createGroup = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const data = request.data as { tenantId: string; name: string; description?: string }
    if (!data?.tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
    wrapValidation(() => SecurityValidator.validateCreateGroup(data))
    const engine = getSecurityEngine(uid, db(), apiKey())
    const { tenantId, ...rest } = data
    return wrapEngineError(() => engine.createGroup(uid, tenantId, rest))
  }
)

export const listGroups = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId } = request.data as { tenantId: string }
    if (!tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.listGroups(uid, tenantId))
  }
)

export const addGroupMember = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, groupId, identityId } = request.data as { tenantId: string; groupId: string; identityId: string }
    if (!tenantId || !groupId || !identityId) throw new HttpsError('invalid-argument', 'tenantId, groupId, and identityId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.addMemberToGroup(uid, tenantId, groupId, identityId))
  }
)

export const removeGroupMember = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, groupId, identityId } = request.data as { tenantId: string; groupId: string; identityId: string }
    if (!tenantId || !groupId || !identityId) throw new HttpsError('invalid-argument', 'tenantId, groupId, and identityId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.removeMemberFromGroup(uid, tenantId, groupId, identityId))
  }
)

export const assignRoleToGroup = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, groupId, roleId } = request.data as { tenantId: string; groupId: string; roleId: string }
    if (!tenantId || !groupId || !roleId) throw new HttpsError('invalid-argument', 'tenantId, groupId, and roleId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.assignRoleToGroup(uid, tenantId, groupId, roleId))
  }
)

// ── User Directory ──────────────────────────────────────────────────────────

export const createServiceAccount = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const data = request.data as { tenantId: string; name: string; description?: string }
    if (!data?.tenantId || !data?.name) throw new HttpsError('invalid-argument', 'tenantId and name required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    const { tenantId, ...rest } = data
    return wrapEngineError(() => engine.createServiceAccount(uid, tenantId, rest))
  }
)

export const listServiceAccounts = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId } = request.data as { tenantId: string }
    if (!tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.listServiceAccounts(uid, tenantId))
  }
)

export const getDirectoryView = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, organizationId } = request.data as { tenantId: string; organizationId?: string }
    if (!tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.getDirectoryView(uid, tenantId, organizationId ?? null))
  }
)

// ── Audit ───────────────────────────────────────────────────────────────────

export const listAuditEvents = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, limit } = request.data as { tenantId: string; limit?: number }
    if (!tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.listAuditEvents(uid, tenantId, limit))
  }
)

// ── Analytics ───────────────────────────────────────────────────────────────

export const getSecurityAnalytics = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId } = request.data as { tenantId: string }
    if (!tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
    const engine = getSecurityEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.getAnalytics(uid, tenantId))
  }
)
