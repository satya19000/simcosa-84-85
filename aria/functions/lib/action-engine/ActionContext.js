"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContext = buildContext;
exports.elapsedMs = elapsedMs;
function buildContext(userId, userDisplayName, db) {
    return {
        userId,
        userDisplayName,
        db,
        requestTimestamp: new Date().toISOString(),
        startHrTime: process.hrtime(),
    };
}
/** Returns elapsed milliseconds since context was created. */
function elapsedMs(ctx) {
    const [s, ns] = process.hrtime(ctx.startHrTime);
    return Math.round(s * 1000 + ns / 1000000);
}
//# sourceMappingURL=ActionContext.js.map