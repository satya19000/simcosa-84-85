"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionApprovalBridge = void 0;
/**
 * The ONLY path by which Mission Control gates a risky step. This bridge
 * never decides risk itself and never executes anything — it builds a
 * CreateApprovalRequestInput from a MissionTask and hands it straight to the
 * real ApprovalEngine (delegation/ApprovalEngine.ts), which owns risk
 * scoring (ApprovalPolicy/computeRiskScore), auto-execute eligibility, and
 * the pending -> approved -> executed state machine. Mission Control then
 * links the resulting ApprovalRequest's id onto the MissionTask so its
 * status can be queried later. No bypass: a task is never marked completed
 * by this bridge — completion still has to go through
 * MissionEngine.completeTask once the caller observes (via
 * getLinkedApprovalStatus or ApprovalEvents) that the request reached
 * 'approved'/'executed'.
 */
class MissionApprovalBridge {
    constructor(approvalEngine, tasks) {
        this.approvalEngine = approvalEngine;
        this.tasks = tasks;
    }
    async requestApprovalForTask(userId, task, input) {
        const request = await this.approvalEngine.createApprovalRequest(userId, {
            ...input,
            createdBy: userId,
        });
        await this.tasks.linkApprovalRequest(userId, task.id, request.id);
        if (request.status === 'pending') {
            await this.tasks.setStatus(userId, task.id, 'blocked');
        }
        return request;
    }
    async getLinkedApprovalStatus(userId, task) {
        if (!task.approvalRequestId)
            return null;
        return this.approvalEngine.getApprovalRequest(userId, task.approvalRequestId);
    }
}
exports.MissionApprovalBridge = MissionApprovalBridge;
//# sourceMappingURL=MissionApprovalBridge.js.map