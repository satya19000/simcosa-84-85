"use strict";
// ── AI Marketplace & Skills Ecosystem — Shared Types (Phase 5.3) ───────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.SKILL_LIFECYCLE_STATUSES = exports.EXTERNAL_API_PERMISSION_SCOPES = exports.HIGH_RISK_PERMISSION_SCOPES = exports.SKILL_PERMISSION_SCOPES = exports.MARKETPLACE_CATEGORIES = exports.MARKETPLACE_ITEM_TYPES = void 0;
exports.MARKETPLACE_ITEM_TYPES = [
    'plugin', 'skill', 'agent', 'workflow', 'dashboard', 'template',
    'prompt_pack', 'organization_template', 'health_module', 'finance_module',
    'communication_module', 'document_module', 'navigation_module', 'custom_extension',
];
exports.MARKETPLACE_CATEGORIES = [
    'Productivity', 'Executive Assistant', 'Healthcare', 'Public Health', 'Finance',
    'Documents', 'Communication', 'Travel', 'Education', 'Government',
    'Personal Life', 'Automation', 'Developer Tools',
];
exports.SKILL_PERMISSION_SCOPES = [
    'read.tasks', 'write.tasks', 'read.contacts', 'write.contacts',
    'read.documents', 'write.documents', 'read.health', 'write.health',
    'read.finance', 'write.finance', 'read.location', 'write.location',
    'send.email', 'send.sms', 'send.whatsapp', 'install.plugins',
    'run.workflows', 'execute.actions', 'access.ai', 'access.memory',
    'access.organization',
];
/** Permission scopes that are HIGH RISK and require approval before grant/install. */
exports.HIGH_RISK_PERMISSION_SCOPES = [
    'send.email', 'send.sms', 'send.whatsapp', // external communication
    'read.documents', 'write.documents', // document access
    'read.health', 'write.health', // health data access
    'read.finance', 'write.finance', // finance data access
    'read.location', 'write.location', // location access
    'access.organization', // organization admin access
    'install.plugins', // plugin installation
    'run.workflows', // workflow automation
];
/** External-API-call-equivalent scope — covered by execute.actions + install.plugins for now. */
exports.EXTERNAL_API_PERMISSION_SCOPES = ['execute.actions', 'install.plugins'];
exports.SKILL_LIFECYCLE_STATUSES = [
    'draft', 'submitted', 'under_review', 'approved', 'published',
    'installed', 'enabled', 'disabled', 'deprecated', 'removed',
];
//# sourceMappingURL=MarketplaceTypes.js.map