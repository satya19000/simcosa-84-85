"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceLogger = void 0;
/** Structured console logger, mirrors WorkspaceLogger.ts / SecurityLogger.ts. */
class MarketplaceLogger {
    info(scope, message, meta) {
        console.log(`[marketplace:${scope}] ${message}`, meta ?? '');
    }
    warn(scope, message, meta) {
        console.warn(`[marketplace:${scope}] ${message}`, meta ?? '');
    }
    error(scope, message, meta) {
        console.error(`[marketplace:${scope}] ${message}`, meta ?? '');
    }
}
exports.MarketplaceLogger = MarketplaceLogger;
//# sourceMappingURL=MarketplaceLogger.js.map