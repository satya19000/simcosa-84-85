"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceValidator = exports.WorkspaceValidationError = void 0;
class WorkspaceValidationError extends Error {
}
exports.WorkspaceValidationError = WorkspaceValidationError;
const ORG_TYPES = ['personal', 'team', 'department', 'hospital', 'government_office', 'enterprise'];
const MEMBER_ROLES = ['owner', 'admin', 'manager', 'supervisor', 'staff', 'guest', 'viewer'];
/** Pure validation functions — no Firestore access, no side effects. Mirrors MissionValidator.ts. */
class WorkspaceValidator {
    static validateCreateOrganization(data) {
        if (typeof data.name !== 'string' || data.name.trim().length === 0) {
            throw new WorkspaceValidationError('name is required and must be a non-empty string');
        }
        if (data.name.trim().length > 200) {
            throw new WorkspaceValidationError('name must be 200 characters or fewer');
        }
        if (data.type !== undefined && !ORG_TYPES.includes(data.type)) {
            throw new WorkspaceValidationError(`type must be one of: ${ORG_TYPES.join(', ')}`);
        }
        if (data.description !== undefined && typeof data.description !== 'string') {
            throw new WorkspaceValidationError('description must be a string');
        }
    }
    static validateCreateWorkspace(data) {
        if (typeof data.organizationId !== 'string' || !data.organizationId.trim()) {
            throw new WorkspaceValidationError('organizationId is required');
        }
        if (typeof data.name !== 'string' || data.name.trim().length === 0) {
            throw new WorkspaceValidationError('name is required and must be a non-empty string');
        }
        if (data.name.trim().length > 200) {
            throw new WorkspaceValidationError('name must be 200 characters or fewer');
        }
    }
    static validateInvite(data) {
        if (typeof data.organizationId !== 'string' || !data.organizationId.trim()) {
            throw new WorkspaceValidationError('organizationId is required');
        }
        if (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            throw new WorkspaceValidationError('a valid email is required');
        }
        if (data.role !== undefined && !MEMBER_ROLES.includes(data.role)) {
            throw new WorkspaceValidationError(`role must be one of: ${MEMBER_ROLES.join(', ')}`);
        }
    }
    static validateRole(role) {
        if (typeof role !== 'string' || !MEMBER_ROLES.includes(role)) {
            throw new WorkspaceValidationError(`role must be one of: ${MEMBER_ROLES.join(', ')}`);
        }
        return role;
    }
    static validateAnnouncement(data) {
        if (typeof data.organizationId !== 'string' || !data.organizationId.trim()) {
            throw new WorkspaceValidationError('organizationId is required');
        }
        if (typeof data.title !== 'string' || data.title.trim().length === 0) {
            throw new WorkspaceValidationError('title is required');
        }
        if (typeof data.body !== 'string' || data.body.trim().length === 0) {
            throw new WorkspaceValidationError('body is required');
        }
    }
}
exports.WorkspaceValidator = WorkspaceValidator;
//# sourceMappingURL=WorkspaceValidator.js.map