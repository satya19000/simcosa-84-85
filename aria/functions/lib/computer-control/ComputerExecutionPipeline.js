"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerExecutionPipeline = void 0;
const uuid_1 = require("uuid");
/**
 * ComputerExecutionPipeline — orchestrates the full execution flow for a
 * single action step.
 *
 * Stage order (INVARIANT — no step may skip any stage):
 * 1. intent          — validate the execution input shape
 * 2. planner         — validator pre-check (plan + approval record match)
 * 3. safety_guard    — ComputerSafetyGuard.assertSafe (ALWAYS runs first before provider)
 * 4. approval_bridge — approval status check for medium/high/critical steps
 * 5. provider_execution — ComputerActionExecutor.executeStep (calls provider)
 * 6. document_bridge — if step involves file, route to ComputerDocumentBridge
 * 7. ai_gateway      — AI Gateway summary/analysis (if document context present)
 * 8. audit           — final audit record
 *
 * SAFETY CONSTRAINTS:
 * - safety_guard ALWAYS runs before approval_bridge which ALWAYS runs before
 *   provider_execution. No shortcut path exists.
 * - If any stage fails with a non-skippable error, execution halts and the
 *   result records the failed stage.
 * - credentialAccess is blocked at stage 3 by ComputerSafetyGuard — this
 *   pipeline never weakens that guard.
 * - approvalBridge is called via ComputerActionExecutor — no parallel approval
 *   path is introduced here.
 */
class ComputerExecutionPipeline {
    constructor(safetyGuard, approvalBridge, executor, audit, validator) {
        this.safetyGuard = safetyGuard;
        this.approvalBridge = approvalBridge;
        this.executor = executor;
        this.audit = audit;
        this.validator = validator;
    }
    /**
     * Execute a single action step through the full pipeline.
     * Returns a detailed PipelineExecutionResult describing each stage.
     */
    async execute(input) {
        const pipelineId = (0, uuid_1.v4)();
        const stages = [];
        let overallSuccess = false;
        // Stage 1: intent — validate input shape
        const intentStage = this.runStage('intent', () => this.validateInputShape(input));
        stages.push(await intentStage);
        if (!stages[0].success) {
            return this.buildResult(pipelineId, input, stages, overallSuccess);
        }
        // Stage 2: planner — execution validator pre-check
        const plannerStage = await this.runStage('planner', async () => {
            const validation = await this.validator.validate(input.userId, input.plan, input.step, input.approvalRequestId);
            if (!validation.valid) {
                throw new Error(`Execution validation failed: ${validation.errors.join('; ')}`);
            }
            return validation;
        });
        stages.push(plannerStage);
        if (!plannerStage.success) {
            return this.buildResult(pipelineId, input, stages, overallSuccess);
        }
        // Stage 3: safety_guard — hard-block check (MUST run before approval and provider)
        const safetyStage = await this.runStage('safety_guard', () => {
            this.safetyGuard.assertSafe(input.step.capabilityId);
            return { blocked: false, capabilityId: input.step.capabilityId };
        });
        stages.push(safetyStage);
        if (!safetyStage.success) {
            await this.audit.record({
                tenantId: input.tenantId,
                userId: input.userId,
                eventType: 'safety_guard.triggered',
                capabilityId: input.step.capabilityId,
                planId: input.plan.planId,
                riskLevel: input.step.riskLevel,
                metadata: { pipelineId, reason: safetyStage.error },
            });
            return this.buildResult(pipelineId, input, stages, overallSuccess);
        }
        // Stage 4: approval_bridge — check approval status for medium/high/critical
        // This stage is ALWAYS executed for steps requiring approval — no bypass.
        if (input.step.requiresApproval) {
            const approvalStage = await this.runStage('approval_bridge', async () => {
                if (!input.approvalRequestId) {
                    throw new Error(`Step "${input.step.capabilityId}" requires an approvalRequestId.`);
                }
                const approval = await this.approvalBridge.getApprovalStatus(input.userId, input.approvalRequestId);
                if (!approval || approval.status !== 'approved') {
                    throw new Error(`Approval "${input.approvalRequestId}" is ${approval?.status ?? 'not found'} — must be "approved".`);
                }
                return { approvalStatus: approval.status, approvalRequestId: input.approvalRequestId };
            });
            stages.push(approvalStage);
            if (!approvalStage.success) {
                return this.buildResult(pipelineId, input, stages, overallSuccess);
            }
        }
        else {
            stages.push(this.skippedStage('approval_bridge', 'Step does not require approval.'));
        }
        // Stage 5: provider_execution — via ComputerActionExecutor (which also runs safety + approval)
        // ComputerActionExecutor is the ONLY class that calls provider.execute()
        const execStage = await this.runStage('provider_execution', async () => {
            const result = await this.executor.executeStep(input.tenantId, input.userId, input.plan, input.step, input.approvalRequestId);
            if (!result.success) {
                throw new Error(result.error ?? 'Provider execution failed.');
            }
            return result;
        });
        stages.push(execStage);
        // Stage 6: document_bridge — if file context present
        if (input.documentContext) {
            const docStage = await this.runStage('document_bridge', async () => {
                // documentContext is already populated by the caller (analyzeSelectedDocument Cloud Function)
                // We simply record that the document bridge was involved
                return {
                    documentId: input.documentContext.documentId,
                    fileName: input.documentContext.fileName,
                    actionItemCount: input.documentContext.actionItems.length,
                };
            });
            stages.push(docStage);
        }
        else {
            stages.push(this.skippedStage('document_bridge', 'No document context in this action.'));
        }
        // Stage 7: ai_gateway — if AI summary was generated (indicated by documentContext.aiGatewayUsed)
        if (input.documentContext?.aiGatewayUsed) {
            stages.push({
                stage: 'ai_gateway',
                success: true,
                durationMs: 0,
                output: { used: true, documentId: input.documentContext.documentId },
            });
        }
        else {
            stages.push(this.skippedStage('ai_gateway', 'AI Gateway not involved in this action.'));
        }
        // Stage 8: audit — final pipeline audit record
        overallSuccess = execStage.success;
        const auditStage = await this.runStage('audit', async () => {
            const auditEvent = await this.audit.record({
                tenantId: input.tenantId,
                userId: input.userId,
                eventType: overallSuccess ? 'action.executed' : 'action.blocked',
                capabilityId: input.step.capabilityId,
                planId: input.plan.planId,
                approvalRequestId: input.approvalRequestId,
                riskLevel: input.step.riskLevel,
                metadata: {
                    pipelineId,
                    stageCount: stages.length,
                    documentBridgeUsed: !!input.documentContext,
                    aiGatewayUsed: !!input.documentContext?.aiGatewayUsed,
                },
            });
            return { auditEventId: auditEvent.auditId };
        });
        stages.push(auditStage);
        return this.buildResult(pipelineId, input, stages, overallSuccess);
    }
    validateInputShape(input) {
        if (!input.tenantId?.trim())
            throw new Error('tenantId is required.');
        if (!input.userId?.trim())
            throw new Error('userId is required.');
        if (!input.plan?.planId)
            throw new Error('A valid plan with planId is required.');
        if (input.step === undefined || input.step === null)
            throw new Error('step is required.');
        if (!input.step.capabilityId)
            throw new Error('step.capabilityId is required.');
        return { planId: input.plan.planId, capabilityId: input.step.capabilityId };
    }
    async runStage(stage, fn) {
        const start = Date.now();
        try {
            const output = await fn();
            return { stage, success: true, durationMs: Date.now() - start, output: output };
        }
        catch (err) {
            return {
                stage,
                success: false,
                durationMs: Date.now() - start,
                error: err instanceof Error ? err.message : String(err),
            };
        }
    }
    skippedStage(stage, reason) {
        return { stage, success: true, durationMs: 0, skipped: true, output: { reason } };
    }
    buildResult(pipelineId, input, stages, overallSuccess) {
        const execStage = stages.find((s) => s.stage === 'provider_execution');
        const auditStage = stages.find((s) => s.stage === 'audit');
        return {
            pipelineId,
            planId: input.plan.planId,
            stepIndex: input.step.stepIndex,
            capabilityId: input.step.capabilityId,
            overallSuccess,
            stages,
            actionResult: execStage?.output,
            auditEventId: auditStage?.output?.auditEventId,
            executedAt: new Date().toISOString(),
        };
    }
}
exports.ComputerExecutionPipeline = ComputerExecutionPipeline;
//# sourceMappingURL=ComputerExecutionPipeline.js.map