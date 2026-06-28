"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResult = successResult;
exports.failureResult = failureResult;
function successResult(actionId, message, data, executionTimeMs) {
    return { success: true, message, data, error: null, executionTimeMs, actionId };
}
function failureResult(actionId, message, error, executionTimeMs) {
    return { success: false, message, data: null, error, executionTimeMs, actionId };
}
//# sourceMappingURL=ActionResult.js.map