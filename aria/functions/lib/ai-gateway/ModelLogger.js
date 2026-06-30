"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelLogger = void 0;
/**
 * Structured console logger for the AI Gateway. Mirrors MarketplaceLogger /
 * SecurityLogger's shape. NEVER logs full prompt or response text unless
 * `debugMode` is explicitly true on the call — only metadata (provider,
 * model, latency, tokens, cost, error class) is logged by default.
 */
class ModelLogger {
    info(event, fields = {}) {
        console.log(JSON.stringify({ level: 'info', module: 'ai-gateway', event, ...fields }));
    }
    warn(event, fields = {}) {
        console.warn(JSON.stringify({ level: 'warn', module: 'ai-gateway', event, ...fields }));
    }
    error(event, fields = {}) {
        console.error(JSON.stringify({ level: 'error', module: 'ai-gateway', event, ...fields }));
    }
    /** Only call with prompt/response text when `debugMode` is true at the call site. */
    debug(event, fields = {}) {
        console.log(JSON.stringify({ level: 'debug', module: 'ai-gateway', event, ...fields }));
    }
}
exports.ModelLogger = ModelLogger;
//# sourceMappingURL=ModelLogger.js.map