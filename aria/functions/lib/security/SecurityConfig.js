"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SECURITY_CONFIG = exports.DEFAULT_SYSTEM_ROLES = void 0;
exports.DEFAULT_SYSTEM_ROLES = [
    {
        name: 'tenant_owner',
        scope: 'tenant',
        permissions: [
            'organization.read', 'organization.manage',
            'workspace.read', 'workspace.manage',
            'members.invite', 'members.remove',
            'tasks.read', 'tasks.write',
            'missions.read', 'missions.write',
            'approvals.read', 'approvals.approve',
            'documents.read', 'documents.write',
            'plugins.install',
            'security.manage',
            'audit.read',
            'billing.manage',
        ],
    },
    {
        name: 'tenant_admin',
        scope: 'tenant',
        permissions: [
            'organization.read', 'organization.manage',
            'workspace.read', 'workspace.manage',
            'members.invite', 'members.remove',
            'tasks.read', 'tasks.write',
            'missions.read', 'missions.write',
            'approvals.read', 'approvals.approve',
            'documents.read', 'documents.write',
            'plugins.install',
            'audit.read',
        ],
    },
    {
        name: 'workspace_manager',
        scope: 'workspace',
        permissions: [
            'workspace.read', 'workspace.manage',
            'tasks.read', 'tasks.write',
            'missions.read', 'missions.write',
            'documents.read', 'documents.write',
        ],
    },
    {
        name: 'member',
        scope: 'organization',
        permissions: ['organization.read', 'workspace.read', 'tasks.read', 'tasks.write', 'documents.read'],
    },
    {
        name: 'viewer',
        scope: 'organization',
        permissions: ['organization.read', 'workspace.read', 'tasks.read', 'documents.read'],
    },
];
exports.DEFAULT_SECURITY_CONFIG = {
    sessionTtlMs: 20 * 60 * 1000,
    defaultSystemRoles: exports.DEFAULT_SYSTEM_ROLES,
    maxTemporaryRoleDurationMs: 30 * 24 * 60 * 60 * 1000, // 30 days
};
//# sourceMappingURL=SecurityConfig.js.map