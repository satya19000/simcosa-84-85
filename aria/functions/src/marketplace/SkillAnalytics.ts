import type * as admin from 'firebase-admin'
import type { SkillAnalyticsSnapshot, SkillUsageRecord } from './MarketplaceTypes'
import type { MarketplaceRegistry } from './MarketplaceRegistry'

const USAGE_COL = (tenantId: string) => `tenants/${tenantId}/skillUsage`
const INSTALLED_SKILLS_COLLECTION_GROUP = 'installedSkills'
const SKILL_PERMISSIONS_COLLECTION_GROUP = 'skillPermissions'

/** Read-only stats rollup for a marketplace item — installs, uninstalls, active users, errors, ratings. */
export class SkillAnalytics {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly registry: MarketplaceRegistry
  ) {}

  async recordUsage(tenantId: string, actorUserId: string, input: Omit<SkillUsageRecord, 'id' | 'usageId' | 'tenantId' | 'createdBy' | 'createdAt'>): Promise<void> {
    const usageId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toISOString()
    const record: SkillUsageRecord = {
      id: usageId,
      usageId,
      tenantId,
      ...input,
      createdBy: actorUserId,
      createdAt: now,
    }
    await this.db.collection(USAGE_COL(tenantId)).doc(usageId).set(record)
  }

  async getSnapshot(itemId: string): Promise<SkillAnalyticsSnapshot> {
    const item = await this.registry.getItem(itemId)

    const installedSnap = await this.db
      .collectionGroup(INSTALLED_SKILLS_COLLECTION_GROUP)
      .where('itemId', '==', itemId)
      .get()
    const installations = installedSnap.docs.map((d) => d.data())
    const installs = installations.filter((i) => i.status !== 'removed').length
    const uninstalls = installations.filter((i) => i.status === 'removed').length
    const activeUsers = installations.filter((i) => i.status === 'enabled').length
    const failedInstalls = installations.filter((i) => i.status === 'disabled' && i.securityScanRiskLevel === 'high').length

    const permissionsSnap = await this.db
      .collectionGroup(SKILL_PERMISSIONS_COLLECTION_GROUP)
      .where('itemId', '==', itemId)
      .get()
    const permissionGrants = permissionsSnap.docs.filter((d) => d.data().granted === true).length

    let errors = 0
    let usageCount = 0
    for (const installation of installations) {
      const tenantId = installation.tenantId as string
      const usageSnap = await this.db.collection(USAGE_COL(tenantId)).where('itemId', '==', itemId).get()
      usageCount += usageSnap.size
      errors += usageSnap.docs.filter((d) => d.data().eventType === 'error').length
    }

    return {
      itemId,
      installs,
      uninstalls,
      activeUsers,
      errors,
      usageCount,
      ratingAverage: item?.ratingAverage ?? 0,
      approvalRequests: installations.filter((i) => !!i.approvalRequestId).length,
      permissionGrants,
      failedInstalls,
      computedAt: new Date().toISOString(),
    }
  }
}
