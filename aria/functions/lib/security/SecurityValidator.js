"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityValidator = exports.SecurityValidationError = void 0;
const SecurityTypes_1 = require("./SecurityTypes");
class SecurityValidationError extends Error {
    constructor(field, reason) {
        super(`Validation failed for '${field}': ${reason}`);
        this.name = 'SecurityValidationError';
    }
}
exports.SecurityValidationError = SecurityValidationError;
const TENANT_TYPES = ['personal', 'organization', 'enterprise', 'government', 'healthcare', 'education'];
const IDENTITY_TYPES = ['personal_user', 'organization_member', 'guest', 'service_account', 'bot_account', 'super_admin'];
const ROLE_SCOPES = ['tenant', 'organization', 'workspace'];
const POLICY_RESULTS = ['allow', 'deny', 'requireApproval', 'requireElevatedRole', 'auditOnly'];
/** Static input validators, mirrors WorkspaceValidator.ts. Used by securityApi.ts and action handlers before touching SecurityEngine. */
class SecurityValidator {
    static validateCreateTenant(data) {
        if (typeof data.name !== 'string' || data.name.trim().length === 0) {
            throw new SecurityValidationError('name', 'must be a non-empty string');
        }
        if (!TENANT_TYPES.includes(data.tenantType)) {
            throw new SecurityValidationError('tenantType', `must be one of: ${TENANT_TYPES.join(', ')}`);
        }
    }
    static validateIdentityType(value) {
        if (!IDENTITY_TYPES.includes(value)) {
            throw new SecurityValidationError('type', `must be one of: ${IDENTITY_TYPES.join(', ')}`);
        }
    }
    static validateCreateRole(data) {
        if (typeof data.name !== 'string' || data.name.trim().length === 0) {
            throw new SecurityValidationError('name', 'must be a non-empty string');
        }
        if (!ROLE_SCOPES.includes(data.scope)) {
            throw new SecurityValidationError('scope', `must be one of: ${ROLE_SCOPES.join(', ')}`);
        }
        if (!Array.isArray(data.permissions) || data.permissions.some((p) => !SecurityTypes_1.PERMISSION_ACTIONS.includes(p))) {
            throw new SecurityValidationError('permissions', `must be an array of valid permission actions: ${SecurityTypes_1.PERMISSION_ACTIONS.join(', ')}`);
        }
    }
    static validatePermissionAction(value) {
        if (!SecurityTypes_1.PERMISSION_ACTIONS.includes(value)) {
            throw new SecurityValidationError('action', `must be one of: ${SecurityTypes_1.PERMISSION_ACTIONS.join(', ')}`);
        }
    }
    static validateCreatePolicy(data) {
        if (typeof data.name !== 'string' || data.name.trim().length === 0) {
            throw new SecurityValidationError('name', 'must be a non-empty string');
        }
        if (typeof data.description !== 'string') {
            throw new SecurityValidationError('description', 'must be a string');
        }
        this.validatePermissionAction(data.action);
        if (!POLICY_RESULTS.includes(data.result)) {
            throw new SecurityValidationError('result', `must be one of: ${POLICY_RESULTS.join(', ')}`);
        }
    }
    static validateCreateGroup(data) {
        if (typeof data.name !== 'string' || data.name.trim().length === 0) {
            throw new SecurityValidationError('name', 'must be a non-empty string');
        }
    }
}
exports.SecurityValidator = SecurityValidator;
//# sourceMappingURL=SecurityValidator.js.map