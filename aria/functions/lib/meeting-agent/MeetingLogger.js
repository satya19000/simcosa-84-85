"use strict";
/**
 * MeetingLogger.ts — structured logging for the Meeting Agent.
 *
 * PRIVACY INVARIANT: Never logs raw transcript content by default.
 * Only logs event type, session metadata, and non-sensitive details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingLogger = void 0;
class MeetingLogger {
    constructor() {
        this.prefix = '[MeetingAgent]';
        // Explicitly NO method for logging transcript content — by design.
    }
    log(event, sessionId, detail) {
        // Non-sensitive logging only
        console.log(`${this.prefix} ${event} | session=${sessionId}${detail ? ` | ${detail}` : ''}`);
    }
    warn(event, sessionId, detail) {
        console.warn(`${this.prefix} WARN ${event} | session=${sessionId}${detail ? ` | ${detail}` : ''}`);
    }
    error(event, sessionId, err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`${this.prefix} ERROR ${event} | session=${sessionId} | ${msg}`);
    }
}
exports.MeetingLogger = MeetingLogger;
//# sourceMappingURL=MeetingLogger.js.map