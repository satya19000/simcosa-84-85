"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalLogger = void 0;
/**
 * Structured audit logger wrapping ApprovalHistory.record with a consistent
 * shape. ApprovalEngine calls this for every consequential action (approve,
 * reject, execute, rollback, delegate, expire, cancel) so the audit trail is
 * uniform regardless of which code path triggered the transition.
 */
class ApprovalLogger {
    constructor(history) {
        this.history = history;
    }
    async log(userId, entry) {
        await this.history.record(userId, {
            requestId: entry.requestId,
            action: entry.action,
            actor: entry.actor,
            notes: entry.notes,
            details: entry.details,
        });
    }
}
exports.ApprovalLogger = ApprovalLogger;
//# sourceMappingURL=ApprovalLogger.js.map