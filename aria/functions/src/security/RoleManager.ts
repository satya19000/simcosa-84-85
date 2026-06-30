import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { TenantEngine } from './TenantEngine'
import type { RoleRecord, RoleScope, PermissionAction, RoleAssignmentRecord } from './SecurityTypes'
import { DEFAULT_SYSTEM_ROLES } from './SecurityConfig'

const ROLES_COL = (tenantId: string) => `tenants/${tenantId}/roles`
const ASSIGNMENTS_COL = (tenantId: string) => `tenants/${tenantId}/roleAssignments`

/**
 * Repository for tenants/{tenantId}/roles and the role-assignment join
 * collection. Every method requires the actor to already hold a verified
 * tenant identity (checked via TenantEngine.requireIdentity) before reading
 * or writing — same no-cross-tenant-access invariant as TenantEngine/IdentityEngine.
 */
export class RoleManager {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly tenants: TenantEngine
  ) {}

  /** Seed the default system roles for a brand-new tenant. Called only from tenant bootstrap. */
  async seedSystemRoles(tenantId: string, actorUserId: string): Promise<RoleRecord[]> {
    const now = new Date().toISOString()
    const batch = this.db.batch()
    const records: RoleRecord[] = []
    for (const def of DEFAULT_SYSTEM_ROLES) {
      const roleId = uuidv4()
      const record: RoleRecord = {
        id: roleId,
        tenantId,
        roleId,
        name: def.name,
        scope: def.scope,
        permissions: def.permissions,
        inheritsFrom: null,
        isSystem: true,
        createdBy: actorUserId,
        createdAt: now,
        updatedAt: now,
      }
      batch.set(this.db.collection(ROLES_COL(tenantId)).doc(roleId), record)
      records.push(record)
    }
    await batch.commit()
    return records
  }

  async createRole(
    tenantId: string,
    actorUserId: string,
    input: { name: string; scope: RoleScope; permissions: PermissionAction[]; inheritsFrom?: string | null }
  ): Promise<RoleRecord> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const roleId = uuidv4()
    const now = new Date().toISOString()
    const record: RoleRecord = {
      id: roleId,
      tenantId,
      roleId,
      name: input.name.trim(),
      scope: input.scope,
      permissions: input.permissions,
      inheritsFrom: input.inheritsFrom ?? null,
      isSystem: false,
      createdBy: actorUserId,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.collection(ROLES_COL(tenantId)).doc(roleId).set(record)
    return record
  }

  async getRole(tenantId: string, actorUserId: string, roleId: string): Promise<RoleRecord | null> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const snap = await this.db.collection(ROLES_COL(tenantId)).doc(roleId).get()
    return snap.exists ? (snap.data() as RoleRecord) : null
  }

  async getRoleByName(tenantId: string, roleName: string): Promise<RoleRecord | null> {
    const snap = await this.db.collection(ROLES_COL(tenantId)).where('name', '==', roleName).limit(1).get()
    if (snap.empty) return null
    return snap.docs[0].data() as RoleRecord
  }

  async listRoles(tenantId: string, actorUserId: string): Promise<RoleRecord[]> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const snap = await this.db.collection(ROLES_COL(tenantId)).get()
    return snap.docs.map((d) => d.data() as RoleRecord)
  }

  async updateRole(tenantId: string, actorUserId: string, roleId: string, fields: Partial<Pick<RoleRecord, 'name' | 'permissions' | 'inheritsFrom'>>): Promise<RoleRecord | null> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const ref = this.db.collection(ROLES_COL(tenantId)).doc(roleId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ ...fields, updatedAt: new Date().toISOString() })
    const updated = await ref.get()
    return updated.data() as RoleRecord
  }

  /** Resolve the full effective permission set for a role, following inheritsFrom chains (cycle-safe). */
  async resolveEffectivePermissions(tenantId: string, roleId: string, seen: Set<string> = new Set()): Promise<PermissionAction[]> {
    if (seen.has(roleId)) return []
    seen.add(roleId)
    const snap = await this.db.collection(ROLES_COL(tenantId)).doc(roleId).get()
    if (!snap.exists) return []
    const role = snap.data() as RoleRecord
    const own = new Set<PermissionAction>(role.permissions)
    if (role.inheritsFrom) {
      const inherited = await this.resolveEffectivePermissions(tenantId, role.inheritsFrom, seen)
      for (const p of inherited) own.add(p)
    }
    return Array.from(own)
  }

  // ── Role assignments (temporary, delegated, scoped) ──────────────────────

  async assignRole(
    tenantId: string,
    actorUserId: string,
    input: { identityId: string; roleId: string; scope: RoleScope; scopeId?: string | null; expiresAt?: string | null; delegatedBy?: string | null }
  ): Promise<RoleAssignmentRecord> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const assignmentId = uuidv4()
    const record: RoleAssignmentRecord = {
      id: assignmentId,
      tenantId,
      assignmentId,
      identityId: input.identityId,
      roleId: input.roleId,
      scope: input.scope,
      scopeId: input.scopeId ?? null,
      expiresAt: input.expiresAt ?? null,
      delegatedBy: input.delegatedBy ?? null,
      createdBy: actorUserId,
      createdAt: new Date().toISOString(),
    }
    await this.db.collection(ASSIGNMENTS_COL(tenantId)).doc(assignmentId).set(record)
    return record
  }

  async revokeAssignment(tenantId: string, actorUserId: string, assignmentId: string): Promise<boolean> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const ref = this.db.collection(ASSIGNMENTS_COL(tenantId)).doc(assignmentId)
    const snap = await ref.get()
    if (!snap.exists) return false
    await ref.delete()
    return true
  }

  /** List non-expired role assignments for a given identity. Filters out expired temporary roles. */
  async listAssignmentsForIdentity(tenantId: string, actorUserId: string, identityId: string): Promise<RoleAssignmentRecord[]> {
    await this.tenants.requireIdentity(tenantId, actorUserId)
    const snap = await this.db.collection(ASSIGNMENTS_COL(tenantId)).where('identityId', '==', identityId).get()
    const now = Date.now()
    return snap.docs
      .map((d) => d.data() as RoleAssignmentRecord)
      .filter((a) => !a.expiresAt || Date.parse(a.expiresAt) > now)
  }
}
