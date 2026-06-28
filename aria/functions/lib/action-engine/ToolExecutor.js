"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIVITY_LOGS_COLLECTION = exports.ToolExecutor = void 0;
exports.getActivityLogs = getActivityLogs;
const uuid_1 = require("uuid");
const ActionContext_1 = require("./ActionContext");
const ActionResult_1 = require("./ActionResult");
const ActionRegistry_1 = require("./ActionRegistry");
const Errors_1 = require("./Errors");
/**
 * Single entry point for all tool executions.
 *
 * Order of operations:
 *  1. Resolve tool from registry (ToolNotFoundError if missing)
 *  2. Run validate() — pure, no side-effects
 *  3. Run execute() — may write to Firestore / call APIs
 *  4. On execute() failure: attempt rollback(), then wrap as RollbackError if rollback fails
 *  5. Write audit log to Firestore activityLogs/{actionId}
 *  6. Return ActionResult — never throws to the caller
 */
class ToolExecutor {
    constructor(ctx) {
        this.ctx = ctx;
    }
    async run(toolName, args) {
        const actionId = (0, uuid_1.v4)();
        let result;
        try {
            const action = ActionRegistry_1.registry.resolve(toolName);
            // 1. Validate — throws typed error on failure
            action.validate(args);
            // 2. Execute
            result = await action.execute(args, this.ctx);
        }
        catch (rawErr) {
            const engineErr = (0, Errors_1.toActionEngineError)(toolName, rawErr);
            const ms = (0, ActionContext_1.elapsedMs)(this.ctx);
            // 3. Attempt rollback only for execution errors (not validation)
            if (engineErr.code === 'EXECUTION_ERROR' && ActionRegistry_1.registry.has(toolName)) {
                try {
                    await ActionRegistry_1.registry.resolve(toolName).rollback(args, this.ctx);
                }
                catch (rbErr) {
                    // Rollback failure is surfaced as its own error code
                    const rollbackErr = new Errors_1.RollbackError(toolName, rbErr);
                    result = (0, ActionResult_1.failureResult)(actionId, rollbackErr.message, rollbackErr.toActionError(), ms);
                    await this.writeAuditLog(actionId, toolName, args, result);
                    return result;
                }
            }
            result = (0, ActionResult_1.failureResult)(actionId, engineErr.message, engineErr.toActionError(), ms);
        }
        // 4. Always write audit log
        await this.writeAuditLog(actionId, toolName, args, result);
        return result;
    }
    async writeAuditLog(actionId, toolName, args, result) {
        try {
            const action = ActionRegistry_1.registry.has(toolName) ? ActionRegistry_1.registry.resolve(toolName) : null;
            const record = action
                ? action.audit(args, this.ctx, result)
                : buildFallbackAudit(actionId, toolName, this.ctx, result);
            await this.ctx.db
                .collection('activityLogs')
                .doc(actionId)
                .set(record);
        }
        catch {
            // Audit log failure must never propagate — silently swallow so the caller still gets their result
        }
    }
}
exports.ToolExecutor = ToolExecutor;
function buildFallbackAudit(actionId, toolName, ctx, result) {
    return {
        actionId,
        toolName,
        userId: ctx.userId,
        timestamp: ctx.requestTimestamp,
        durationMs: result.executionTimeMs,
        success: result.success,
        argsSummary: {},
        errorCode: result.error?.code ?? null,
        errorDetail: result.error?.detail ?? null,
    };
}
/** Firestore security rules must allow writes to activityLogs only from Cloud Functions. */
exports.ACTIVITY_LOGS_COLLECTION = 'activityLogs';
/** Helper to query audit logs for a user (used by future admin screens). */
async function getActivityLogs(db, userId, limit = 50) {
    const snap = await db
        .collection(exports.ACTIVITY_LOGS_COLLECTION)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
//# sourceMappingURL=ToolExecutor.js.map