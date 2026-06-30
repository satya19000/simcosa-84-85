"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerLogger = void 0;
/**
 * Structured logger for the Computer Control module.
 * Mirrors ModelLogger / MarketplaceLogger pattern.
 *
 * NEVER logs sensitive content (passwords, clipboard text, page content,
 * screenshots, tokens, cookies, private keys) by default.
 * Only metadata (capability ID, risk level, user ID, tenant ID, etc.) is logged.
 */
class ComputerLogger {
    info(event, fields = {}) {
        console.log(JSON.stringify({ level: 'info', module: 'computer-control', event, ...fields }));
    }
    warn(event, fields = {}) {
        console.warn(JSON.stringify({ level: 'warn', module: 'computer-control', event, ...fields }));
    }
    error(event, fields = {}) {
        console.error(JSON.stringify({ level: 'error', module: 'computer-control', event, ...fields }));
    }
    safetyBlock(code, capabilityId, userId, tenantId) {
        console.warn(JSON.stringify({
            level: 'warn',
            module: 'computer-control',
            event: 'safety_guard.triggered',
            code,
            capabilityId,
            userId,
            tenantId,
        }));
    }
}
exports.ComputerLogger = ComputerLogger;
//# sourceMappingURL=ComputerLogger.js.map