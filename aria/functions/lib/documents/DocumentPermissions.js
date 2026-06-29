"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentPermissions = void 0;
const ROLE_PERMISSIONS = {
    owner: [
        'document:read', 'document:upload', 'document:update', 'document:delete',
        'document:share', 'document:export', 'document:ocr', 'document:summarize',
        'document:search', 'document:index', 'analytics:read',
    ],
    viewer: ['document:read', 'document:search'],
    agent: ['document:read', 'document:search', 'document:summarize', 'analytics:read'],
    plugin: ['document:read', 'document:upload', 'document:search'],
};
class DocumentPermissions {
    static can(role, action) {
        return ROLE_PERMISSIONS[role].includes(action);
    }
    static assertCan(role, action) {
        if (!this.can(role, action)) {
            throw new Error(`Role "${role}" cannot perform "${action}"`);
        }
    }
    static getActions(role) {
        return [...ROLE_PERMISSIONS[role]];
    }
}
exports.DocumentPermissions = DocumentPermissions;
//# sourceMappingURL=DocumentPermissions.js.map