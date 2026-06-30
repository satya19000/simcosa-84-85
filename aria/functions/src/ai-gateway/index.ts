import type * as admin from 'firebase-admin'
import { AIGateway } from './AIGateway'
import { DEFAULT_AI_GATEWAY_CONFIG } from './ModelConfig'
import { TenantEngine, RBACEngine, RoleManager, PermissionManager } from '../security'
import type { ProviderApiKeys } from './ProviderRegistry'

// ── Per-user singleton sessions ─────────────────────────────────────────
// Mirrors marketplace/index.ts's getMarketplaceEngine / security/index.ts's
// getSecurityEngine TTL singleton pattern exactly. The session key is purely
// about reusing warm engine + provider-client instances across invocations
// from the same caller, NOT a tenant boundary — every AIGateway method that
// touches tenants/{tenantId}/** still verifies tenant identity via
// TenantEngine.requireIdentity before any read/write.

interface Session {
  engine: AIGateway
  createdAt: number
}

const sessions = new Map<string, Session>()
const SESSION_TTL_MS = 20 * 60 * 1000

function getSession(userId: string, db: admin.firestore.Firestore, apiKeys: ProviderApiKeys): Session {
  const existing = sessions.get(userId)
  if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS) return existing

  const tenants = new TenantEngine(db)
  const roles = new RoleManager(db, tenants)
  const permissionManager = new PermissionManager(db, tenants, roles)
  const rbac = new RBACEngine(db, tenants, roles, permissionManager)

  const session: Session = {
    engine: new AIGateway(db, DEFAULT_AI_GATEWAY_CONFIG, apiKeys, tenants, rbac),
    createdAt: Date.now(),
  }
  sessions.set(userId, session)
  return session
}

export function getAIGateway(userId: string, db: admin.firestore.Firestore, apiKeys: ProviderApiKeys): AIGateway {
  return getSession(userId, db, apiKeys).engine
}

// ── Re-exports ────────────────────────────────────────────────────────────

export { AIGateway } from './AIGateway'
export type { GatewayCompleteInput } from './AIGateway'
export { ModelRouter } from './ModelRouter'
export { ProviderRegistry } from './ProviderRegistry'
export type { ProviderApiKeys } from './ProviderRegistry'
export { ProviderHealthTracker } from './ProviderHealth'
export { ModelCatalogStore, MODEL_CATALOG } from './ModelCatalog'
export { ModelPolicyEngine } from './ModelPolicyEngine'
export { ModelCostEstimator } from './ModelCostEstimator'
export { ModelFallbackManager, GatewayUserFacingError } from './ModelFallbackManager'
export { ModelBenchmark } from './ModelBenchmark'
export { ModelUsageTracker } from './ModelUsageTracker'
export { ModelTelemetry } from './ModelTelemetry'
export { PromptNormalizer } from './PromptNormalizer'
export type { BuildPromptInput } from './PromptNormalizer'
export { ResponseNormalizer } from './ResponseNormalizer'
export { StreamingManager } from './StreamingManager'
export { TokenEstimator } from './TokenEstimator'
export { ModelPermissions } from './ModelPermissions'
export { DEFAULT_AI_GATEWAY_CONFIG } from './ModelConfig'
export type { AIGatewayConfig } from './ModelConfig'
export { ModelLogger } from './ModelLogger'
export type { ModelProvider, ProviderHealthCheckResult, CompleteOptions, StreamChunk } from './ModelProvider'
export * from './ModelTypes'
