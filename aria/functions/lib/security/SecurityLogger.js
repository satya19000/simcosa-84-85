"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityLogger = void 0;
/** Structured console logger, mirrors WorkspaceLogger.ts / ApprovalLogger.ts. */
class SecurityLogger {
    info(tenantId, event, data) {
        console.log(`[security:${tenantId}] ${event}`, data ?? {});
    }
    warn(tenantId, event, data) {
        console.warn(`[security:${tenantId}] ${event}`, data ?? {});
    }
    error(tenantId, event, data) {
        console.error(`[security:${tenantId}] ${event}`, data ?? {});
    }
}
exports.SecurityLogger = SecurityLogger;
//# sourceMappingURL=SecurityLogger.js.map