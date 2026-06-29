"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowMetrics = void 0;
/** Collects metrics during a single workflow execution. */
class WorkflowMetrics {
    constructor(executionId, workflowId, startedAt) {
        this.executionId = executionId;
        this.workflowId = workflowId;
        this.startedAt = startedAt;
        this.stepCount = 0;
        this.successfulSteps = 0;
        this.failedSteps = 0;
        this.skippedSteps = 0;
        this.retryCount = 0;
        this.aiCallCount = 0;
        this.pluginCallCount = 0;
        this.actionCallCount = 0;
        this.notificationCount = 0;
        this.cacheHits = 0;
    }
    recordStepStarted() { this.stepCount++; }
    recordStepSuccess() { this.successfulSteps++; }
    recordStepFailure() { this.failedSteps++; }
    recordStepSkipped() { this.skippedSteps++; }
    recordRetry() { this.retryCount++; }
    recordAICall() { this.aiCallCount++; }
    recordPluginCall() { this.pluginCallCount++; }
    recordActionCall() { this.actionCallCount++; }
    recordNotification() { this.notificationCount++; }
    recordCacheHit() { this.cacheHits++; }
    snapshot() {
        return {
            executionId: this.executionId,
            workflowId: this.workflowId,
            totalDurationMs: Date.now() - this.startedAt,
            stepCount: this.stepCount,
            successfulSteps: this.successfulSteps,
            failedSteps: this.failedSteps,
            skippedSteps: this.skippedSteps,
            retryCount: this.retryCount,
            aiCallCount: this.aiCallCount,
            pluginCallCount: this.pluginCallCount,
            actionCallCount: this.actionCallCount,
            notificationCount: this.notificationCount,
            cacheHits: this.cacheHits,
            peakMemoryEstimateBytes: process.memoryUsage().heapUsed,
            completedAt: new Date().toISOString(),
        };
    }
}
exports.WorkflowMetrics = WorkflowMetrics;
//# sourceMappingURL=WorkflowMetrics.js.map