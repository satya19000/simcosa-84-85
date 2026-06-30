"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerActionExecutor = void 0;
/**
 * ComputerActionExecutor — the ONLY class that may invoke a provider.
 *
 * Execution invariants (ALL must pass before any provider.execute call):
 * 1. SafetyGuard.assertSafe(capabilityId) — hard-block check (includes
 *    unconditional credentialAccess block)
 * 2. Permissions.requireCapabilityPermission(tenantId, userId, capabilityId)
 * 3. For medium/high/critical steps: ApprovalBridge verifies approval status
 *    is genuinely 'approved' — no execution if pending/rejected
 * 4. SafetyGuard.assertApprovalState — secondary guard
 *
 * Agents MUST NOT call provider.execute() directly — always go through this
 * executor.
 */
class ComputerActionExecutor {
    constructor(safetyGuard, permissions, approvalBridge, audit, provider, logger) {
        this.safetyGuard = safetyGuard;
        this.permissions = permissions;
        this.approvalBridge = approvalBridge;
        this.audit = audit;
        this.provider = provider;
        this.logger = logger;
    }
    /**
     * Execute a single step of an approved action plan.
     * The plan must be in 'approved' status before calling this method.
     * For steps requiring approval, the approvalRequestId must already be
     * in 'approved' status via the real ApprovalEngine.
     */
    async executeStep(tenantId, userId, plan, step, approvalRequestId) {
        // 1. Safety guard — hard-block check (credentialAccess always blocked here)
        try {
            this.safetyGuard.assertSafe(step.capabilityId);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.safetyBlock('SAFETY_GUARD_BLOCKED', step.capabilityId, userId, tenantId);
            await this.audit.record({
                tenantId,
                userId,
                eventType: 'safety_guard.triggered',
                capabilityId: step.capabilityId,
                planId: plan.planId,
                riskLevel: step.riskLevel,
                metadata: { reason: message },
            });
            return { success: false, capabilityId: step.capabilityId, error: message };
        }
        // 2. Permission check
        try {
            await this.permissions.requireCapabilityPermission(tenantId, userId, step.capabilityId);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Permission denied';
            this.logger.warn('capability.denied', { capabilityId: step.capabilityId, userId, tenantId });
            await this.audit.record({
                tenantId,
                userId,
                eventType: 'capability.denied',
                capabilityId: step.capabilityId,
                planId: plan.planId,
                riskLevel: step.riskLevel,
                metadata: { reason: message },
            });
            return { success: false, capabilityId: step.capabilityId, error: message };
        }
        // 3. Approval gate for medium/high/critical steps
        if (step.requiresApproval) {
            if (!approvalRequestId) {
                const msg = `Step "${step.capabilityId}" requires approval but no approvalRequestId was provided.`;
                await this.audit.record({
                    tenantId, userId, eventType: 'action.blocked',
                    capabilityId: step.capabilityId, planId: plan.planId, riskLevel: step.riskLevel,
                    metadata: { reason: msg },
                });
                return { success: false, capabilityId: step.capabilityId, error: msg };
            }
            const approval = await this.approvalBridge.getApprovalStatus(userId, approvalRequestId);
            if (!approval || approval.status !== 'approved') {
                const msg = `Action "${step.capabilityId}" cannot execute: approval is ${approval?.status ?? 'not found'}.`;
                await this.audit.record({
                    tenantId, userId, eventType: 'action.blocked',
                    capabilityId: step.capabilityId, planId: plan.planId, riskLevel: step.riskLevel,
                    approvalRequestId,
                    metadata: { approvalStatus: approval?.status ?? null },
                });
                return { success: false, capabilityId: step.capabilityId, error: msg };
            }
            // 4. Secondary safety guard — approval state check
            this.safetyGuard.assertApprovalState(step.capabilityId, true);
        }
        // 5. Execute via provider
        let result;
        try {
            result = await this.provider.execute(step.capabilityId, step.parameters ?? {});
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Execution error';
            result = { success: false, capabilityId: step.capabilityId, error: message };
        }
        await this.audit.record({
            tenantId,
            userId,
            eventType: result.success ? 'action.executed' : 'action.blocked',
            capabilityId: step.capabilityId,
            planId: plan.planId,
            approvalRequestId,
            riskLevel: step.riskLevel,
            metadata: {
                notImplemented: result.notImplemented ?? false,
                success: result.success,
            },
        });
        this.logger.info('action.executed', {
            capabilityId: step.capabilityId,
            success: result.success,
            notImplemented: result.notImplemented ?? false,
            planId: plan.planId,
            userId,
            tenantId,
        });
        return result;
    }
}
exports.ComputerActionExecutor = ComputerActionExecutor;
//# sourceMappingURL=ComputerActionExecutor.js.map