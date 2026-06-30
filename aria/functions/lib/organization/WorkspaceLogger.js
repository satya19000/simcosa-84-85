"use strict";
/* eslint-disable no-console */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceLogger = void 0;
/** Thin structured logger — mirrors ApprovalLogger's "consistent shape" philosophy, stdout-only (Cloud Functions log sink). */
class WorkspaceLogger {
    info(organizationId, event, details) {
        console.log(JSON.stringify({ level: 'info', module: 'organization', organizationId, event, details, at: new Date().toISOString() }));
    }
    warn(organizationId, event, details) {
        console.warn(JSON.stringify({ level: 'warn', module: 'organization', organizationId, event, details, at: new Date().toISOString() }));
    }
    error(organizationId, event, details) {
        console.error(JSON.stringify({ level: 'error', module: 'organization', organizationId, event, details, at: new Date().toISOString() }));
    }
}
exports.WorkspaceLogger = WorkspaceLogger;
//# sourceMappingURL=WorkspaceLogger.js.map