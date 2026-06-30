import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { RBACEngine } from '../security/RBACEngine'
import type { SkillPermissionScope, SkillPermissionGrantRecord } from './MarketplaceTypes'
import { HIGH_RISK_PERMISSION_SCOPES } from './MarketplaceTypes'

const SKILL_PERMISSIONS_COL = (tenantId: string) => `tenants/${tenantId}/skillPermissions`

/**
 * Evaluates and records skill permission grants. Permission EVALUATION
 * (does this actor have rights to install something requesting these
 * scopes) is delegated entirely to the real security/RBACEngine via
 * `requirePermission`/`can` — this class never reimplements RBAC logic.
 * It only maps skill permission scopes to the underlying tenant
 * `security.manage`/`plugins.install` actions and persists the resulting
 * grant records.
 */
export class SkillPermissions {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly rbac: RBACEngine
  ) {}

  /** True if any requested scope is high-risk (requires approval before grant). */
  static hasHighRiskScope(scopes: SkillPermissionScope[]): boolean {
    return scopes.some((s) => HIGH_RISK_PERMISSION_SCOPES.includes(s))
  }

  /** Verifies the installing actor holds the underlying tenant permission to install plugins at all. */
  async requireCanInstall(tenantId: string, actorUserId: string): Promise<void> {
    await this.rbac.requirePermission(tenantId, actorUserId, 'plugins.install')
  }

  async recordGrants(
    tenantId: string,
    actorUserId: string,
    installationId: string,
    itemId: string,
    scopes: SkillPermissionScope[]
  ): Promise<SkillPermissionGrantRecord[]> {
    const now = new Date().toISOString()
    const records: SkillPermissionGrantRecord[] = []
    for (const scope of scopes) {
      const permissionId = uuidv4()
      const record: SkillPermissionGrantRecord = {
        id: permissionId,
        permissionId,
        tenantId,
        installationId,
        itemId,
        scope,
        granted: true,
        grantedBy: actorUserId,
        createdBy: actorUserId,
        createdAt: now,
        updatedAt: now,
      }
      await this.db.collection(SKILL_PERMISSIONS_COL(tenantId)).doc(permissionId).set(record)
      records.push(record)
    }
    return records
  }

  async revokeGrant(tenantId: string, permissionId: string): Promise<SkillPermissionGrantRecord | null> {
    const ref = this.db.collection(SKILL_PERMISSIONS_COL(tenantId)).doc(permissionId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ granted: false, updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as SkillPermissionGrantRecord
  }

  async listGrants(tenantId: string, installationId: string): Promise<SkillPermissionGrantRecord[]> {
    const snap = await this.db.collection(SKILL_PERMISSIONS_COL(tenantId)).where('installationId', '==', installationId).get()
    return snap.docs.map((d) => d.data() as SkillPermissionGrantRecord)
  }
}
