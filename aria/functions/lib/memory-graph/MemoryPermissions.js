"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryPermissions = void 0;
const ROLE_PERMISSIONS = {
    owner: {
        allowedActions: [
            'node:read', 'node:create', 'node:update', 'node:delete',
            'edge:read', 'edge:create', 'edge:delete',
            'graph:rebuild', 'graph:export', 'analytics:read',
        ],
        canPin: true,
        canExport: true,
    },
    reader: {
        allowedActions: ['node:read', 'edge:read', 'analytics:read'],
        canPin: false,
        canExport: false,
    },
    agent: {
        allowedActions: ['node:read', 'node:create', 'node:update', 'edge:read', 'edge:create', 'analytics:read'],
        canPin: false,
        canExport: false,
    },
    plugin: {
        allowedActions: ['node:read', 'node:create', 'edge:read', 'edge:create'],
        canPin: false,
        canExport: false,
    },
};
class MemoryPermissions {
    static getPermissions(role) {
        return ROLE_PERMISSIONS[role];
    }
    static can(role, action) {
        return ROLE_PERMISSIONS[role].allowedActions.includes(action);
    }
    static assertCan(role, action) {
        if (!this.can(role, action)) {
            throw new Error(`Role "${role}" is not allowed to perform "${action}"`);
        }
    }
}
exports.MemoryPermissions = MemoryPermissions;
//# sourceMappingURL=MemoryPermissions.js.map