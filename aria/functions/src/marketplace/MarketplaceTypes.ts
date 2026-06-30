// ── AI Marketplace & Skills Ecosystem — Shared Types (Phase 5.3) ───────────

/** Every kind of installable item the marketplace can list. */
export type MarketplaceItemType =
  | 'plugin' | 'skill' | 'agent' | 'workflow' | 'dashboard' | 'template'
  | 'prompt_pack' | 'organization_template' | 'health_module' | 'finance_module'
  | 'communication_module' | 'document_module' | 'navigation_module' | 'custom_extension'

export const MARKETPLACE_ITEM_TYPES: MarketplaceItemType[] = [
  'plugin', 'skill', 'agent', 'workflow', 'dashboard', 'template',
  'prompt_pack', 'organization_template', 'health_module', 'finance_module',
  'communication_module', 'document_module', 'navigation_module', 'custom_extension',
]

/** Default catalog categories. */
export type MarketplaceCategory =
  | 'Productivity' | 'Executive Assistant' | 'Healthcare' | 'Public Health' | 'Finance'
  | 'Documents' | 'Communication' | 'Travel' | 'Education' | 'Government'
  | 'Personal Life' | 'Automation' | 'Developer Tools'

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  'Productivity', 'Executive Assistant', 'Healthcare', 'Public Health', 'Finance',
  'Documents', 'Communication', 'Travel', 'Education', 'Government',
  'Personal Life', 'Automation', 'Developer Tools',
]

/** Closed vocabulary of skill permission scopes — evaluated via the real Security/Policy Engine, never duplicated. */
export type SkillPermissionScope =
  | 'read.tasks' | 'write.tasks' | 'read.contacts' | 'write.contacts'
  | 'read.documents' | 'write.documents' | 'read.health' | 'write.health'
  | 'read.finance' | 'write.finance' | 'read.location' | 'write.location'
  | 'send.email' | 'send.sms' | 'send.whatsapp' | 'install.plugins'
  | 'run.workflows' | 'execute.actions' | 'access.ai' | 'access.memory'
  | 'access.organization'

export const SKILL_PERMISSION_SCOPES: SkillPermissionScope[] = [
  'read.tasks', 'write.tasks', 'read.contacts', 'write.contacts',
  'read.documents', 'write.documents', 'read.health', 'write.health',
  'read.finance', 'write.finance', 'read.location', 'write.location',
  'send.email', 'send.sms', 'send.whatsapp', 'install.plugins',
  'run.workflows', 'execute.actions', 'access.ai', 'access.memory',
  'access.organization',
]

/** Permission scopes that are HIGH RISK and require approval before grant/install. */
export const HIGH_RISK_PERMISSION_SCOPES: SkillPermissionScope[] = [
  'send.email', 'send.sms', 'send.whatsapp', // external communication
  'read.documents', 'write.documents', // document access
  'read.health', 'write.health', // health data access
  'read.finance', 'write.finance', // finance data access
  'read.location', 'write.location', // location access
  'access.organization', // organization admin access
  'install.plugins', // plugin installation
  'run.workflows', // workflow automation
]

/** External-API-call-equivalent scope — covered by execute.actions + install.plugins for now. */
export const EXTERNAL_API_PERMISSION_SCOPES: SkillPermissionScope[] = ['execute.actions', 'install.plugins']

export type SkillLifecycleStatus =
  | 'draft' | 'submitted' | 'under_review' | 'approved' | 'published'
  | 'installed' | 'enabled' | 'disabled' | 'deprecated' | 'removed'

export const SKILL_LIFECYCLE_STATUSES: SkillLifecycleStatus[] = [
  'draft', 'submitted', 'under_review', 'approved', 'published',
  'installed', 'enabled', 'disabled', 'deprecated', 'removed',
]

export type PricingModel = 'free' | 'one_time' | 'subscription' | 'usage_based'
export type InstallationType = 'tenant' | 'organization' | 'personal'
export type SecurityLevel = 'low' | 'medium' | 'high'

/** Declares everything about a marketplace skill without installing it. Mirrors PluginManifest's shape philosophy. */
export interface SkillManifest {
  id: string
  name: string
  slug: string
  version: string
  author: string
  publisherId: string
  description: string
  category: MarketplaceCategory
  icon: string | null
  screenshots: string[]
  itemType: MarketplaceItemType
  capabilities: string[]
  permissions: SkillPermissionScope[]
  requiredPlugins: string[]
  requiredEngines: string[]
  compatibleVersions: string[]
  pricingModel: PricingModel
  installationType: InstallationType
  securityLevel: SecurityLevel
  createdAt: string
  updatedAt: string
}

/** A published marketplace catalog listing — marketplace/items/{itemId}. */
export interface MarketplaceItemRecord {
  id: string
  itemId: string
  manifest: SkillManifest
  status: SkillLifecycleStatus
  installCount: number
  ratingAverage: number
  ratingCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

/** marketplace/publishers/{publisherId}. */
export interface PublisherRecord {
  id: string
  publisherId: string
  userId: string
  displayName: string
  verified: boolean
  itemIds: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

/** marketplace/categories/{categoryId}. */
export interface CategoryRecord {
  id: string
  categoryId: string
  name: MarketplaceCategory
  description: string
  itemCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type ReviewStatus = 'visible' | 'flagged' | 'removed'

/** marketplace/reviews/{reviewId}. */
export interface SkillReviewRecord {
  id: string
  reviewId: string
  itemId: string
  versionReviewed: string
  reviewerId: string
  rating: number // 1-5
  reviewText: string
  status: ReviewStatus
  createdBy: string
  createdAt: string
  updatedAt: string
}

/** tenants/{tenantId}/installedSkills/{installationId}. */
export interface SkillInstallationRecord {
  id: string
  installationId: string
  tenantId: string
  organizationId: string | null
  itemId: string
  manifestVersion: string
  status: SkillLifecycleStatus
  installedPluginId: string | null
  approvalRequestId: string | null
  securityScanScore: number
  securityScanRiskLevel: SecurityLevel
  grantedPermissions: SkillPermissionScope[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

/** tenants/{tenantId}/skillPermissions/{permissionId}. */
export interface SkillPermissionGrantRecord {
  id: string
  permissionId: string
  tenantId: string
  installationId: string
  itemId: string
  scope: SkillPermissionScope
  granted: boolean
  grantedBy: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type SkillUsageEventType = 'invoked' | 'error' | 'enabled' | 'disabled'

/** tenants/{tenantId}/skillUsage/{usageId}. */
export interface SkillUsageRecord {
  id: string
  usageId: string
  tenantId: string
  installationId: string
  itemId: string
  eventType: SkillUsageEventType
  detail: string | null
  createdBy: string
  createdAt: string
}

/** tenants/{tenantId}/skillAudit/{auditId} — append-only, mirrors security/SecurityAudit.ts's contract. */
export interface SkillAuditRecord {
  id: string
  auditId: string
  tenantId: string
  organizationId: string | null
  actorId: string
  itemId: string | null
  installationId: string | null
  action: string
  resource: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  riskLevel: SecurityLevel | 'critical'
  timestamp: string
}

/** organizations/{organizationId}/installedSkills/{installationId} — thin mapping pointer, mirrors DelegationManager's pattern. */
export interface OrganizationSkillMappingRecord {
  id: string
  organizationId: string
  installationId: string
  tenantId: string
  itemId: string
  createdBy: string
  createdAt: string
}

/** Structured (placeholder) security scan result — see SkillSecurityScanner.ts for the honest-disclosure contract. */
export interface SecurityScanResult {
  score: number // 0-100, higher = riskier
  riskLevel: SecurityLevel
  permissionRiskScore: number
  dependencyRiskScore: number
  externalApiRiskScore: number
  dataAccessRiskScore: number
  healthFinanceRiskScore: number
  organizationImpactRiskScore: number
  reasons: string[]
  scannedAt: string
  /** Always true — documents that this is NOT a real malware/code scan. */
  isPlaceholder: true
}

export interface CompatibilityCheckResult {
  compatible: boolean
  reasons: string[]
}

export interface DependencyResolutionResult {
  resolved: boolean
  missingPlugins: string[]
  missingEngines: string[]
}

export interface SkillAnalyticsSnapshot {
  itemId: string
  installs: number
  uninstalls: number
  activeUsers: number
  errors: number
  usageCount: number
  ratingAverage: number
  approvalRequests: number
  permissionGrants: number
  failedInstalls: number
  computedAt: string
}
