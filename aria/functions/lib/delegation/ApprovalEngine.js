"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalEngine = void 0;
const ApprovalQueue_1 = require("./ApprovalQueue");
const ApprovalHistory_1 = require("./ApprovalHistory");
const ApprovalPolicy_1 = require("./ApprovalPolicy");
const ApprovalTemplates_1 = require("./ApprovalTemplates");
const ApprovalNotifications_1 = require("./ApprovalNotifications");
const ApprovalAnalytics_1 = require("./ApprovalAnalytics");
const ApprovalMetrics_1 = require("./ApprovalMetrics");
const ApprovalScheduler_1 = require("./ApprovalScheduler");
const ApprovalRegistry_1 = require("./ApprovalRegistry");
const ApprovalPermissions_1 = require("./ApprovalPermissions");
const ApprovalLogger_1 = require("./ApprovalLogger");
const ApprovalRequest_1 = require("./ApprovalRequest");
const memory_graph_1 = require("../memory-graph");
/**
 * Facade orchestrating the entire Human Approval Platform. Mirrors
 * FinanceEngine's constructor signature and per-user singleton pattern.
 *
 * Hard invariant: no method on this engine executes a registered risky
 * action unless the underlying ApprovalRequest's status is genuinely
 * 'approved' at the moment of execution. approveRequest() is the only path
 * that can transition pending -> approved -> (optionally) executed; every
 * other method either reads, or moves a request to a terminal/handoff state
 * (rejected/cancelled/expired/delegated) without ever invoking an executor.
 */
class ApprovalEngine {
    constructor(db, config, apiKey) {
        this.db = db;
        this.config = config;
        this.apiKey = apiKey;
        this.queue = new ApprovalQueue_1.ApprovalQueue(db);
        this.history = new ApprovalHistory_1.ApprovalHistory(db);
        this.policy = new ApprovalPolicy_1.ApprovalPolicy(config);
        this.templates = new ApprovalTemplates_1.ApprovalTemplates();
        this.notifications = new ApprovalNotifications_1.ApprovalNotifications(db);
        this.analytics = new ApprovalAnalytics_1.ApprovalAnalytics(this.queue);
        this.metrics = new ApprovalMetrics_1.ApprovalMetrics(this.analytics);
        this.registry = new ApprovalRegistry_1.ApprovalRegistry();
        this.permissions = new ApprovalPermissions_1.ApprovalPermissions(db);
        this.logger = new ApprovalLogger_1.ApprovalLogger(this.history);
        this.scheduler = new ApprovalScheduler_1.ApprovalScheduler(this.queue, this.notifications, config);
    }
    // ── Creation ──────────────────────────────────────────────────────────────
    async createApprovalRequest(userId, input) {
        const riskScore = (0, ApprovalRequest_1.computeRiskScore)(input.riskFactors);
        const level = this.policy.determineApprovalLevel(riskScore);
        const autoEligible = this.policy.isAutoExecuteEligible(riskScore, input.triggerType);
        const request = (0, ApprovalRequest_1.buildApprovalRequest)({
            userId,
            title: input.title,
            summary: input.summary,
            reason: input.reason,
            triggerType: input.triggerType,
            actions: input.actions,
            rollbackPlan: input.rollbackPlan,
            estimatedDurationMs: input.estimatedDurationMs ?? 0,
            createdBy: input.createdBy,
            riskFactors: input.riskFactors,
            approvalLevel: level,
            workflowId: input.workflowId,
            status: autoEligible ? 'approved' : 'pending',
            expiresInMs: input.expiresInMs,
        }, this.config);
        await this.queue.create(request);
        await this.logger.log(userId, { requestId: request.id, actor: input.createdBy, action: 'created', details: { riskScore, autoEligible } });
        void this.linkApprovalToMemory(userId, request);
        if (!autoEligible) {
            void this.notifications.notifyApprovalRequired(request);
            return request;
        }
        // Auto-execute path: eligible AND below auto-execute threshold AND not an
        // always-manual trigger. Only proceeds if an executor is actually
        // registered; otherwise the request simply sits 'approved', awaiting a
        // human to trigger execution via approveRequest/rollbackRequest tooling.
        this.metrics.recordAutoExecuted();
        return this.executeIfPossible(userId, request, 'system:auto-execute');
    }
    async getApprovalRequest(userId, id) {
        return this.queue.get(userId, id);
    }
    // ── Decisions ─────────────────────────────────────────────────────────────
    async approveRequest(userId, id, approvedBy) {
        const current = await this.queue.get(userId, id);
        if (!current)
            return null;
        if (current.status !== 'pending') {
            throw new Error(`Cannot approve request ${id}: status is "${current.status}", expected "pending"`);
        }
        const approved = await this.queue.approve(userId, id, approvedBy);
        if (!approved)
            return null;
        await this.logger.log(userId, { requestId: id, actor: approvedBy, action: 'approved' });
        void this.notifications.notifyApprovalCompleted(approved);
        return this.executeIfPossible(userId, approved, approvedBy);
    }
    async rejectRequest(userId, id, rejectedBy, reason) {
        const result = await this.queue.reject(userId, id, rejectedBy, reason);
        if (result) {
            await this.logger.log(userId, { requestId: id, actor: rejectedBy, action: 'rejected', notes: reason });
            void this.notifications.notifyApprovalRejected(result, reason);
        }
        return result;
    }
    async cancelRequest(userId, id, cancelledBy, reason) {
        const result = await this.queue.cancel(userId, id, cancelledBy, reason);
        if (result)
            await this.logger.log(userId, { requestId: id, actor: cancelledBy, action: 'cancelled', notes: reason });
        return result;
    }
    async delegateRequest(userId, id, delegatedTo, delegatedBy) {
        const result = await this.queue.delegate(userId, id, delegatedTo, delegatedBy);
        if (result) {
            await this.logger.log(userId, { requestId: id, actor: delegatedBy, action: 'delegated', details: { delegatedTo } });
            void this.linkDelegationToMemory(userId, result);
        }
        return result;
    }
    async bulkApprove(userId, ids, approvedBy) {
        const results = [];
        for (const id of ids) {
            const r = await this.approveRequest(userId, id, approvedBy);
            if (r)
                results.push(r);
        }
        return results;
    }
    async bulkReject(userId, ids, rejectedBy, reason) {
        const results = [];
        for (const id of ids) {
            const r = await this.rejectRequest(userId, id, rejectedBy, reason);
            if (r)
                results.push(r);
        }
        return results;
    }
    // ── Execution / Rollback ──────────────────────────────────────────────────
    /** Internal: only ever called once status has reached 'approved'. Asserts this invariant. */
    async executeIfPossible(userId, request, actor) {
        if (request.status !== 'approved') {
            // Not an error — many requests sit approved without an executor registered yet.
            return request;
        }
        const executor = this.registry.getExecutor(request.triggerType);
        if (!executor)
            return request; // no executor wired; remains 'approved' until one is
        try {
            await executor.execute(request);
            const executed = await this.queue.markExecuted(userId, request.id, actor);
            if (executed) {
                await this.logger.log(userId, { requestId: request.id, actor, action: 'executed' });
                void this.notifications.notifyExecutionFinished(executed, true);
                return executed;
            }
            return request;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            try {
                await executor.rollback(request);
            }
            catch {
                // best-effort rollback; failure is recorded regardless
            }
            const rolledBack = await this.queue.markRolledBack(userId, request.id, 'system:execution-failure', message);
            await this.logger.log(userId, { requestId: request.id, actor, action: 'rolled_back', notes: message });
            if (rolledBack)
                void this.notifications.notifyExecutionFinished(rolledBack, false, message);
            return rolledBack ?? request;
        }
    }
    async rollbackRequest(userId, id, actor) {
        const request = await this.queue.get(userId, id);
        if (!request)
            return null;
        if (request.status !== 'executed') {
            throw new Error(`Cannot rollback request ${id}: status is "${request.status}", expected "executed"`);
        }
        const executor = this.registry.getExecutor(request.triggerType);
        if (!executor)
            throw new Error(`No executor registered for triggerType "${request.triggerType}" — cannot roll back`);
        await executor.rollback(request);
        const verified = await executor.verify(request);
        const result = await this.queue.markRolledBack(userId, id, actor, verified ? undefined : 'verification failed after rollback');
        if (result)
            await this.logger.log(userId, { requestId: id, actor, action: 'rolled_back', details: { verified } });
        return result;
    }
    // ── Listing (Executive Dashboard sections) ───────────────────────────────
    async listPending(userId) {
        return this.queue.listPending(userId);
    }
    async listUrgent(userId) {
        return this.queue.listUrgent(userId, this.config.expiringSoonWindowMs);
    }
    async listExpired(userId) {
        return this.queue.listExpired(userId);
    }
    async listExecuted(userId) {
        return this.queue.list(userId, { status: 'executed' });
    }
    async listDelegated(userId) {
        return this.queue.list(userId, { status: 'delegated' });
    }
    async listRejected(userId) {
        return this.queue.list(userId, { status: 'rejected' });
    }
    async listAll(userId, filters = {}) {
        return this.queue.list(userId, filters);
    }
    // ── Stats / Metrics / Policy ─────────────────────────────────────────────
    async getStats(userId) {
        return this.analytics.getStats(userId);
    }
    async getMetrics(userId) {
        return this.metrics.getSnapshot(userId);
    }
    getPolicyBands() {
        return this.policy.getBands();
    }
    // ── Templates ─────────────────────────────────────────────────────────────
    listTemplates() {
        return this.templates.listTemplates();
    }
    getTemplate(triggerType) {
        return this.templates.getTemplate(triggerType);
    }
    // ── History ───────────────────────────────────────────────────────────────
    async listHistory(userId, requestId) {
        if (requestId)
            return this.history.listForRequest(userId, requestId);
        return this.history.listAll(userId);
    }
    // ── Scheduler ─────────────────────────────────────────────────────────────
    async runScheduledChecks(userId) {
        return this.scheduler.runAllChecks(userId);
    }
    // ── Registry passthrough (for callers/plugins wiring executors) ─────────
    get executors() {
        return this.registry;
    }
    // ── Permissions passthrough ───────────────────────────────────────────────
    get permissionsApi() {
        return this.permissions;
    }
    // ── Memory Graph Integration ──────────────────────────────────────────────
    // Best-effort, identical import/usage pattern to FinanceEngine.linkBudgetToMemory.
    async linkApprovalToMemory(userId, request) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            await graph.upsertNode('task', request.title, `${request.triggerType} approval (risk ${request.riskScore}/100, level ${request.approvalLevel})`, { approvalRequestId: request.id, status: request.status }, request.riskScore >= 50 ? 35 : 20);
        }
        catch {
            // best-effort
        }
    }
    async linkDelegationToMemory(userId, request) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            await graph.upsertNode('task', `Delegated: ${request.title}`, `Delegated to ${request.delegatedTo ?? 'unknown'}`, { approvalRequestId: request.id, delegatedTo: request.delegatedTo }, 20);
        }
        catch {
            // best-effort
        }
    }
}
exports.ApprovalEngine = ApprovalEngine;
//# sourceMappingURL=ApprovalEngine.js.map