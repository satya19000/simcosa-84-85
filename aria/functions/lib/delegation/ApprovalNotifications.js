"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalNotifications = void 0;
const uuid_1 = require("uuid");
const COL = (userId) => `users/${userId}/approvalNotifications`;
/**
 * Writes internal in-app notification records about the approval process
 * itself (e.g. "you have a pending approval", "this is expiring soon").
 * These are NOT external comms — they ARE the approval UX. This class never
 * sends email/WhatsApp/SMS; any external-facing action must itself go through
 * the Approval Engine as a separate, explicitly-approved request.
 */
class ApprovalNotifications {
    constructor(db) {
        this.db = db;
    }
    async write(userId, requestId, type, title, body) {
        const payload = {
            id: (0, uuid_1.v4)(),
            userId,
            requestId,
            type,
            title,
            body,
            createdAt: new Date().toISOString(),
            read: false,
        };
        await this.db.collection(COL(userId)).doc(payload.id).set(payload);
        return payload;
    }
    async notifyApprovalRequired(request) {
        return this.write(request.userId, request.id, 'approval_required', `Approval required: ${request.title}`, `${request.summary} (risk ${request.riskScore}/100, level: ${request.approvalLevel})`);
    }
    async notifyApprovalExpiring(request) {
        return this.write(request.userId, request.id, 'approval_expiring', `Expiring soon: ${request.title}`, `This approval request expires at ${request.expiresAt}.`);
    }
    async notifyApprovalCompleted(request) {
        return this.write(request.userId, request.id, 'approval_completed', `Approved: ${request.title}`, `This request was approved and is ready for execution.`);
    }
    async notifyApprovalRejected(request, reason) {
        return this.write(request.userId, request.id, 'approval_rejected', `Rejected: ${request.title}`, reason ? `This request was rejected: ${reason}` : 'This request was rejected.');
    }
    async notifyExecutionFinished(request, success, details) {
        return this.write(request.userId, request.id, 'execution_finished', success ? `Executed: ${request.title}` : `Execution failed: ${request.title}`, details ?? (success ? 'Execution completed successfully.' : 'Execution failed and was rolled back where possible.'));
    }
    async list(userId, limit = 100) {
        const snap = await this.db.collection(COL(userId)).orderBy('createdAt', 'desc').limit(limit).get();
        return snap.docs.map((d) => d.data());
    }
}
exports.ApprovalNotifications = ApprovalNotifications;
//# sourceMappingURL=ApprovalNotifications.js.map