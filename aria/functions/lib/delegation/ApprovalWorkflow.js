"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalWorkflow = void 0;
const ApprovalEvents_1 = require("./ApprovalEvents");
/**
 * Workflow Engine integration point.
 *
 * HONEST STATUS (as of Phase 4.11): the Workflow Engine
 * (`aria/functions/src/workflows/WorkflowRunner.ts`) does NOT currently have
 * a generic pause/resume primitive — `executeStep` runs each step to
 * completion synchronously within a single invocation (see its `wait`,
 * `parallel`, `delay` step kinds). There is no "pause this workflow run,
 * persist state, and resume later when an external event fires" mechanism
 * today, the same way the Finance Workflow Integration section of
 * `finance/FinanceEngine.ts` documents in its "Workflow: Expense -> Approval
 * -> Budget Check -> Payment -> Audit Log" comment.
 *
 * What IS wired today: `createGate` creates a real ApprovalRequest linked to
 * a `workflowId` and persists it via ApprovalQueue. Callers (workflow step
 * implementations, agents, etc.) can poll `getGateStatus` or subscribe to
 * `approval:approved` / `approval:rejected` via ApprovalEvents to find out
 * when a gated step's approval has resolved, then decide what to do next
 * (e.g. continue a follow-up Cloud Function invocation, or have the
 * WorkflowRunner's `action` step kind call ApprovalEngine.createApprovalRequest
 * and short-circuit with a "pending_approval" result instead of completing).
 *
 * PHASE 5.0 TODO: add a first-class `'approval_gate'` WorkflowStep kind to
 * `WorkflowStep.ts` / `WorkflowRunner.ts` that:
 *   1. Calls `ApprovalWorkflow.createGate(...)` and persists workflow run
 *      state (via the existing `WorkflowState.ts` persistence, which already
 *      exists for resuming across cold starts).
 *   2. Subscribes an `ApprovalEvents.on('approval:approved' | 'approval:rejected', ...)`
 *      handler (or a Firestore-trigger Cloud Function watching
 *      approvalRequests) that calls back into WorkflowRunner to resume the
 *      paused run from the next step.
 * Until that lands, gated workflows must be split into two separate Cloud
 * Function invocations by the caller: one that creates the approval request
 * and stops, and a second (triggered externally, e.g. by the dashboard or a
 * scheduled check) that resumes once `getGateStatus` reports a terminal
 * status.
 */
class ApprovalWorkflow {
    constructor(queue) {
        this.queue = queue;
    }
    async createGate(userId, workflowId, requestFactory) {
        const request = requestFactory();
        request.workflowId = workflowId;
        return this.queue.create(request);
    }
    async getGateStatus(userId, requestId) {
        const request = await this.queue.get(userId, requestId);
        return request?.status ?? null;
    }
    /** Best-effort subscription helper; caller is responsible for unsubscribing (returned fn). */
    onGateResolved(handler) {
        const offApproved = ApprovalEvents_1.ApprovalEvents.on('approval:approved', (e) => handler(e.payload.requestId, 'approved'));
        const offRejected = ApprovalEvents_1.ApprovalEvents.on('approval:rejected', (e) => handler(e.payload.requestId, 'rejected'));
        return () => {
            offApproved();
            offRejected();
        };
    }
}
exports.ApprovalWorkflow = ApprovalWorkflow;
//# sourceMappingURL=ApprovalWorkflow.js.map