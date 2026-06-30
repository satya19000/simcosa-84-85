import type * as admin from 'firebase-admin'
import type { MemberRecord, MemberRole } from './WorkspaceTypes'
import { ROLE_ORDER } from './WorkspaceTypes'

const MEMBERS_COL = (organizationId: string) => `organizations/${organizationId}/members`

/**
 * Single source of truth for all role/membership checks in the organization
 * module. Mirrors ApprovalPermissions.ts's role-ordering pattern.
 *
 * Hard invariant (the "no cross-organization access" rule for Phase 5.1,
 * equivalent in importance to "no approval bypass" in Phase 4.11/5.0):
 * every read/write performed by OrganizationEngine and its Manager classes
 * MUST call requireMember() (or requireRole()) before touching any document
 * under organizations/{organizationId}/**. No method may skip this check.
 */
export class WorkspacePermissions {
  constructor(private readonly db: admin.firestore.Firestore) {}

  /** Look up a user's membership record for an organization. Returns null if not a member. */
  async getMembership(organizationId: string, userId: string): Promise<MemberRecord | null> {
    const snap = await this.db
      .collection(MEMBERS_COL(organizationId))
      .where('userId', '==', userId)
      .limit(1)
      .get()
    if (snap.empty) return null
    const record = snap.docs[0].data() as MemberRecord
    if (record.status !== 'active') return null
    return record
  }

  /** True if userId is an active member of organizationId, regardless of role. */
  async isMember(organizationId: string, userId: string): Promise<boolean> {
    const record = await this.getMembership(organizationId, userId)
    return record !== null
  }

  /** Throws if userId is not an active member of organizationId. Returns the membership record. */
  async requireMember(organizationId: string, userId: string): Promise<MemberRecord> {
    const record = await this.getMembership(organizationId, userId)
    if (!record) {
      throw new Error(`Access denied: user ${userId} is not a member of organization ${organizationId}`)
    }
    return record
  }

  /** True if record.role is at or above minRole in privilege order. */
  hasRoleAtLeast(role: MemberRole, minRole: MemberRole): boolean {
    return ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(minRole)
  }

  /** Throws unless userId is a member of organizationId with role >= minRole. Returns the membership record. */
  async requireRole(organizationId: string, userId: string, minRole: MemberRole): Promise<MemberRecord> {
    const record = await this.requireMember(organizationId, userId)
    if (!this.hasRoleAtLeast(record.role, minRole)) {
      throw new Error(
        `Access denied: user ${userId} has role "${record.role}" in organization ${organizationId}, requires at least "${minRole}"`
      )
    }
    return record
  }

  /** Read-only roles (guest, viewer) may never perform writes. Throws if record.role is read-only. */
  assertCanWrite(record: MemberRecord): void {
    if (record.role === 'guest' || record.role === 'viewer') {
      throw new Error(`Access denied: role "${record.role}" is read-only and cannot perform writes`)
    }
  }

  /** Convenience: require membership AND write capability (role above guest/viewer). */
  async requireWriter(organizationId: string, userId: string): Promise<MemberRecord> {
    const record = await this.requireMember(organizationId, userId)
    this.assertCanWrite(record)
    return record
  }
}
