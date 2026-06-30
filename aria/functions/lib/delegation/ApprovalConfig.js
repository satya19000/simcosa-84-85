"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_APPROVAL_CONFIG = void 0;
// Risk bands per spec: <20 auto-execute eligible, 20-50 simple, 50-80 executive,
// 80+ always manual (mapped to 'manager'/'emergency' levels — never auto-executed).
exports.DEFAULT_APPROVAL_CONFIG = {
    defaultExpiryMs: 24 * 60 * 60 * 1000, // 24h
    expiringSoonWindowMs: 2 * 60 * 60 * 1000, // 2h
    autoExecuteThreshold: 20,
    simpleThreshold: 50,
    executiveThreshold: 80,
    delegationDefaultExpiryMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxListLimit: 100,
    maxRetries: 3,
    retryDelayMs: 2000,
};
//# sourceMappingURL=ApprovalConfig.js.map