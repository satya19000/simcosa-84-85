"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalRegistry = void 0;
exports.registerExecutor = registerExecutor;
exports.getExecutor = getExecutor;
exports.listExecutors = listExecutors;
exports.unregisterExecutor = unregisterExecutor;
const executors = new Map();
function registerExecutor(executor) {
    executors.set(executor.triggerType, executor);
}
function getExecutor(triggerType) {
    return executors.get(triggerType);
}
function listExecutors() {
    return [...executors.values()];
}
function unregisterExecutor(triggerType) {
    executors.delete(triggerType);
}
// ── Registry ──────────────────────────────────────────────────────────────────
// Deliberately empty by default, mirroring Finance/Health's registry pattern.
// No concrete executor is pre-registered for ANY triggerType — wiring an
// actual "send_email", "delete_documents", etc. executor is the
// responsibility of the calling module/plugin that owns that capability
// (e.g. the Communication Hub registers the send_email/send_whatsapp
// executors, the Document Workspace registers delete_documents, etc.).
// Until an executor is registered for a triggerType, ApprovalEngine will
// leave matching approved requests sitting in 'approved' state — it will
// NEVER perform the action itself.
class ApprovalRegistry {
    registerExecutor(executor) {
        registerExecutor(executor);
    }
    getExecutor(triggerType) {
        return getExecutor(triggerType);
    }
    listExecutors() {
        return listExecutors();
    }
    unregisterExecutor(triggerType) {
        unregisterExecutor(triggerType);
    }
}
exports.ApprovalRegistry = ApprovalRegistry;
//# sourceMappingURL=ApprovalRegistry.js.map