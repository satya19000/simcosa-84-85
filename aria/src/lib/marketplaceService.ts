import { httpsCallable } from 'firebase/functions'
import { functions as fns } from './firebase'

const publishSkillFn = httpsCallable(fns, 'publishSkill')
const updateSkillFn = httpsCallable(fns, 'updateSkill')
const submitSkillForReviewFn = httpsCallable(fns, 'submitSkillForReview')
const approveSkillFn = httpsCallable(fns, 'approveSkill')
const rejectSkillFn = httpsCallable(fns, 'rejectSkill')
const installSkillFn = httpsCallable(fns, 'installSkill')
const uninstallSkillFn = httpsCallable(fns, 'uninstallSkill')
const enableSkillFn = httpsCallable(fns, 'enableSkill')
const disableSkillFn = httpsCallable(fns, 'disableSkill')
const listInstalledSkillsFn = httpsCallable(fns, 'listInstalledSkills')
const grantSkillPermissionFn = httpsCallable(fns, 'grantSkillPermission')
const revokeSkillPermissionFn = httpsCallable(fns, 'revokeSkillPermission')
const reviewSkillFn = httpsCallable(fns, 'reviewSkill')
const listMarketplaceCatalogFn = httpsCallable(fns, 'listMarketplaceCatalog')
const getSkillDetailFn = httpsCallable(fns, 'getSkillDetail')
const getSkillAnalyticsFn = httpsCallable(fns, 'getSkillAnalytics')

// ── Shared types (mirrors aria/functions/src/marketplace/MarketplaceTypes.ts) ─

export type MarketplaceItemType =
  | 'plugin' | 'skill' | 'agent' | 'workflow' | 'dashboard' | 'template'
  | 'prompt_pack' | 'organization_template' | 'health_module' | 'finance_module'
  | 'communication_module' | 'document_module' | 'navigation_module' | 'custom_extension'

export const MARKETPLACE_ITEM_TYPES: MarketplaceItemType[] = [
  'plugin', 'skill', 'agent', 'workflow', 'dashboard', 'template',
  'prompt_pack', 'organization_template', 'health_module', 'finance_module',
  'communication_module', 'document_module', 'navigation_module', 'custom_extension',
]

export type MarketplaceCategory =
  | 'Productivity' | 'Executive Assistant' | 'Healthcare' | 'Public Health' | 'Finance'
  | 'Documents' | 'Communication' | 'Travel' | 'Education' | 'Government'
  | 'Personal Life' | 'Automation' | 'Developer Tools'

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  'Productivity', 'Executive Assistant', 'Healthcare', 'Public Health', 'Finance',
  'Documents', 'Communication', 'Travel', 'Education', 'Government',
  'Personal Life', 'Automation', 'Developer Tools',
]

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

export type SkillLifecycleStatus =
  | 'draft' | 'submitted' | 'under_review' | 'approved' | 'published'
  | 'installed' | 'enabled' | 'disabled' | 'deprecated' | 'removed'

export type PricingModel = 'free' | 'one_time' | 'subscription' | 'usage_based'
export type InstallationType = 'tenant' | 'organization' | 'personal'
export type SecurityLevel = 'low' | 'medium' | 'high'

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

export interface SkillReviewRecord {
  id: string
  reviewId: string
  itemId: string
  versionReviewed: string
  reviewerId: string
  rating: number
  reviewText: string
  status: 'visible' | 'flagged' | 'removed'
  createdBy: string
  createdAt: string
  updatedAt: string
}

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

export interface CatalogFilters {
  category?: MarketplaceCategory
  itemType?: MarketplaceItemType
  search?: string
  pricingModel?: string
}

export interface CatalogPage {
  items: MarketplaceItemRecord[]
  total: number
  page: number
  pageSize: number
}

// ── Publishing ───────────────────────────────────────────────────────────────

export async function publishSkill(manifest: Partial<SkillManifest>): Promise<MarketplaceItemRecord> {
  const result = await publishSkillFn(manifest)
  return result.data as MarketplaceItemRecord
}

export async function updateSkill(itemId: string, patch: Partial<SkillManifest>): Promise<MarketplaceItemRecord | null> {
  const result = await updateSkillFn({ itemId, ...patch })
  return result.data as MarketplaceItemRecord | null
}

export async function submitSkillForReview(itemId: string): Promise<MarketplaceItemRecord | null> {
  const result = await submitSkillForReviewFn({ itemId })
  return result.data as MarketplaceItemRecord | null
}

export async function approveSkill(itemId: string): Promise<MarketplaceItemRecord | null> {
  const result = await approveSkillFn({ itemId })
  return result.data as MarketplaceItemRecord | null
}

export async function rejectSkill(itemId: string): Promise<MarketplaceItemRecord | null> {
  const result = await rejectSkillFn({ itemId })
  return result.data as MarketplaceItemRecord | null
}

// ── Installation ────────────────────────────────────────────────────────────

export async function installSkill(tenantId: string, itemId: string, organizationId?: string): Promise<SkillInstallationRecord> {
  const result = await installSkillFn({ tenantId, organizationId, itemId })
  return result.data as SkillInstallationRecord
}

export async function uninstallSkill(tenantId: string, installationId: string): Promise<SkillInstallationRecord | null> {
  const result = await uninstallSkillFn({ tenantId, installationId })
  return result.data as SkillInstallationRecord | null
}

export async function enableSkill(tenantId: string, installationId: string): Promise<SkillInstallationRecord | null> {
  const result = await enableSkillFn({ tenantId, installationId })
  return result.data as SkillInstallationRecord | null
}

export async function disableSkill(tenantId: string, installationId: string): Promise<SkillInstallationRecord | null> {
  const result = await disableSkillFn({ tenantId, installationId })
  return result.data as SkillInstallationRecord | null
}

export async function listInstalledSkills(tenantId: string): Promise<SkillInstallationRecord[]> {
  const result = await listInstalledSkillsFn({ tenantId })
  return result.data as SkillInstallationRecord[]
}

// ── Permissions ──────────────────────────────────────────────────────────────

export async function grantSkillPermission(tenantId: string, installationId: string, itemId: string, scopes: SkillPermissionScope[]): Promise<SkillPermissionGrantRecord[]> {
  const result = await grantSkillPermissionFn({ tenantId, installationId, itemId, scopes })
  return result.data as SkillPermissionGrantRecord[]
}

export async function revokeSkillPermission(tenantId: string, permissionId: string): Promise<SkillPermissionGrantRecord | null> {
  const result = await revokeSkillPermissionFn({ tenantId, permissionId })
  return result.data as SkillPermissionGrantRecord | null
}

// ── Reviews ──────────────────────────────────────────────────────────────────

export async function reviewSkill(itemId: string, rating: number, reviewText: string, versionReviewed: string): Promise<SkillReviewRecord> {
  const result = await reviewSkillFn({ itemId, rating, reviewText, versionReviewed })
  return result.data as SkillReviewRecord
}

// ── Catalog / Read ───────────────────────────────────────────────────────────

export async function listMarketplaceCatalog(filters: CatalogFilters = {}, page = 1, pageSize = 20): Promise<CatalogPage> {
  const result = await listMarketplaceCatalogFn({ ...filters, page, pageSize })
  return result.data as CatalogPage
}

export async function getSkillDetail(itemId: string): Promise<MarketplaceItemRecord | null> {
  const result = await getSkillDetailFn({ itemId })
  return result.data as MarketplaceItemRecord | null
}

// ── Analytics ────────────────────────────────────────────────────────────────

export async function getSkillAnalytics(itemId: string): Promise<SkillAnalyticsSnapshot> {
  const result = await getSkillAnalyticsFn({ itemId })
  return result.data as SkillAnalyticsSnapshot
}
