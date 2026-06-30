import type { MemberRole, OrganizationType } from './WorkspaceTypes'

export class WorkspaceValidationError extends Error {}

const ORG_TYPES: OrganizationType[] = ['personal', 'team', 'department', 'hospital', 'government_office', 'enterprise']
const MEMBER_ROLES: MemberRole[] = ['owner', 'admin', 'manager', 'supervisor', 'staff', 'guest', 'viewer']

/** Pure validation functions — no Firestore access, no side effects. Mirrors MissionValidator.ts. */
export class WorkspaceValidator {
  static validateCreateOrganization(data: { name?: unknown; type?: unknown; description?: unknown }): void {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new WorkspaceValidationError('name is required and must be a non-empty string')
    }
    if (data.name.trim().length > 200) {
      throw new WorkspaceValidationError('name must be 200 characters or fewer')
    }
    if (data.type !== undefined && !ORG_TYPES.includes(data.type as OrganizationType)) {
      throw new WorkspaceValidationError(`type must be one of: ${ORG_TYPES.join(', ')}`)
    }
    if (data.description !== undefined && typeof data.description !== 'string') {
      throw new WorkspaceValidationError('description must be a string')
    }
  }

  static validateCreateWorkspace(data: { name?: unknown; organizationId?: unknown }): void {
    if (typeof data.organizationId !== 'string' || !data.organizationId.trim()) {
      throw new WorkspaceValidationError('organizationId is required')
    }
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new WorkspaceValidationError('name is required and must be a non-empty string')
    }
    if (data.name.trim().length > 200) {
      throw new WorkspaceValidationError('name must be 200 characters or fewer')
    }
  }

  static validateInvite(data: { email?: unknown; role?: unknown; organizationId?: unknown }): void {
    if (typeof data.organizationId !== 'string' || !data.organizationId.trim()) {
      throw new WorkspaceValidationError('organizationId is required')
    }
    if (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new WorkspaceValidationError('a valid email is required')
    }
    if (data.role !== undefined && !MEMBER_ROLES.includes(data.role as MemberRole)) {
      throw new WorkspaceValidationError(`role must be one of: ${MEMBER_ROLES.join(', ')}`)
    }
  }

  static validateRole(role: unknown): MemberRole {
    if (typeof role !== 'string' || !MEMBER_ROLES.includes(role as MemberRole)) {
      throw new WorkspaceValidationError(`role must be one of: ${MEMBER_ROLES.join(', ')}`)
    }
    return role as MemberRole
  }

  static validateAnnouncement(data: { title?: unknown; body?: unknown; organizationId?: unknown }): void {
    if (typeof data.organizationId !== 'string' || !data.organizationId.trim()) {
      throw new WorkspaceValidationError('organizationId is required')
    }
    if (typeof data.title !== 'string' || data.title.trim().length === 0) {
      throw new WorkspaceValidationError('title is required')
    }
    if (typeof data.body !== 'string' || data.body.trim().length === 0) {
      throw new WorkspaceValidationError('body is required')
    }
  }
}
