import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { getMarketplaceEngine } from './marketplace'
import { SkillValidationError } from './marketplace/SkillValidator'
import type {
  SkillManifest, SkillPermissionScope, MarketplaceCategory, MarketplaceItemType,
} from './marketplace/MarketplaceTypes'

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
    if (err instanceof SkillValidationError) throw new HttpsError('invalid-argument', err.message)
    throw err
  }
}

function wrapEngineError<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch((err) => {
    const message = err instanceof Error ? err.message : 'Operation failed'
    if (message.includes('Access denied')) throw new HttpsError('permission-denied', message)
    if (message.includes('not found')) throw new HttpsError('not-found', message)
    throw new HttpsError('failed-precondition', message)
  })
}

// ── Publishing ────────────────────────────────────────────────────────────

export const publishSkill = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const manifest = request.data as Partial<SkillManifest>
    wrapValidation(() => undefined) // validation occurs inside SkillManager.createDraft
    const engine = getMarketplaceEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.publish(uid, manifest))
  }
)

export const updateSkill = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { itemId, ...patch } = request.data as { itemId: string } & Partial<SkillManifest>
    if (!itemId) throw new HttpsError('invalid-argument', 'itemId required')
    const engine = getMarketplaceEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.updateSkill(itemId, patch))
  }
)

export const submitSkillForReview = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { itemId } = request.data as { itemId: string }
    if (!itemId) throw new HttpsError('invalid-argument', 'itemId required')
    const engine = getMarketplaceEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.submitForReview(itemId))
  }
)

export const approveSkill = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { itemId } = request.data as { itemId: string }
    if (!itemId) throw new HttpsError('invalid-argument', 'itemId required')
    const engine = getMarketplaceEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.approve(itemId))
  }
)

export const rejectSkill = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { itemId } = request.data as { itemId: string }
    if (!itemId) throw new HttpsError('invalid-argument', 'itemId required')
    const engine = getMarketplaceEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.reject(itemId))
  }
)

// ── Installation ────────────────────────────────────────────────────────

export const installSkill = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, organizationId, itemId } = request.data as { tenantId: string; organizationId?: string; itemId: string }
    if (!tenantId || !itemId) throw new HttpsError('invalid-argument', 'tenantId and itemId required')
    const engine = getMarketplaceEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.install(uid, { tenantId, organizationId: organizationId ?? null, itemId }))
  }
)

export const uninstallSkill = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, installationId } = request.data as { tenantId: string; installationId: string }
    if (!tenantId || !installationId) throw new HttpsError('invalid-argument', 'tenantId and installationId required')
    const engine = getMarketplaceEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.uninstall(uid, tenantId, installationId))
  }
)

export const enableSkill = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, installationId } = request.data as { tenantId: string; installationId: string }
    if (!tenantId || !installationId) throw new HttpsError('invalid-argument', 'tenantId and installationId required')
    const engine = getMarketplaceEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.enable(uid, tenantId, installationId))
  }
)

export const disableSkill = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, installationId } = request.data as { tenantId: string; installationId: string }
    if (!tenantId || !installationId) throw new HttpsError('invalid-argument', 'tenantId and installationId required')
    const engine = getMarketplaceEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.disable(uid, tenantId, installationId))
  }
)

export const listInstalledSkills = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId } = request.data as { tenantId: string }
    if (!tenantId) throw new HttpsError('invalid-argument', 'tenantId required')
    const engine = getMarketplaceEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.listInstalled(uid, tenantId))
  }
)

// ── Permissions ──────────────────────────────────────────────────────────

export const grantSkillPermission = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, installationId, itemId, scopes } = request.data as {
      tenantId: string; installationId: string; itemId: string; scopes: SkillPermissionScope[]
    }
    if (!tenantId || !installationId || !itemId || !Array.isArray(scopes)) {
      throw new HttpsError('invalid-argument', 'tenantId, installationId, itemId, and scopes required')
    }
    const engine = getMarketplaceEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.grantPermission(tenantId, uid, installationId, itemId, scopes))
  }
)

export const revokeSkillPermission = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { tenantId, permissionId } = request.data as { tenantId: string; permissionId: string }
    if (!tenantId || !permissionId) throw new HttpsError('invalid-argument', 'tenantId and permissionId required')
    const engine = getMarketplaceEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.revokePermission(tenantId, uid, permissionId))
  }
)

// ── Reviews ──────────────────────────────────────────────────────────────

export const reviewSkill = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { itemId, rating, reviewText, versionReviewed } = request.data as {
      itemId: string; rating: number; reviewText: string; versionReviewed: string
    }
    if (!itemId) throw new HttpsError('invalid-argument', 'itemId required')
    const engine = getMarketplaceEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.recordReview(uid, itemId, { rating, reviewText, versionReviewed }))
  }
)

// ── Catalog / Read ───────────────────────────────────────────────────────

export const listMarketplaceCatalog = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { category, itemType, search, pricingModel, page, pageSize } = request.data as {
      category?: MarketplaceCategory; itemType?: MarketplaceItemType; search?: string; pricingModel?: string; page?: number; pageSize?: number
    }
    const engine = getMarketplaceEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.listCatalog({ category, itemType, search, pricingModel }, page, pageSize))
  }
)

export const getSkillDetail = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 },
  async (request) => {
    const uid = requireAuth(request)
    const { itemId } = request.data as { itemId: string }
    if (!itemId) throw new HttpsError('invalid-argument', 'itemId required')
    const engine = getMarketplaceEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.getSkillDetail(itemId))
  }
)

// ── Analytics ────────────────────────────────────────────────────────────

export const getSkillAnalytics = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 },
  async (request) => {
    const uid = requireAuth(request)
    const { itemId } = request.data as { itemId: string }
    if (!itemId) throw new HttpsError('invalid-argument', 'itemId required')
    const engine = getMarketplaceEngine(uid, db(), apiKey())
    return wrapEngineError(() => engine.getAnalytics(itemId))
  }
)
