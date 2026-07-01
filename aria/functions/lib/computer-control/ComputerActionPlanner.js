"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerActionPlanner = void 0;
const uuid_1 = require("uuid");
/**
 * ComputerActionPlanner — converts user intent into a PROPOSED action plan.
 *
 * CRITICAL INVARIANT: This class NEVER auto-executes. It only produces a
 * proposed plan that must be reviewed, approved, and explicitly triggered
 * by the user through the approval flow.
 *
 * Example (from spec): "Open the vaccination report and prepare a summary"
 * → Plan steps:
 *   1. Ask user to choose file (uploadFileWithUserPicker)
 *   2. Upload/read file through approved picker
 *   3. Send to Document Intelligence (reference point only — not executed here)
 *   4. Generate summary (Document Intelligence result)
 *   5. Save summary (copyToClipboard or createFile with approval)
 *   6. Ask whether to create a task/reminder
 *
 * The planner does NOT execute any steps — it returns a plan object for
 * display to the user and subsequent approval/execution by ComputerActionExecutor.
 */
class ComputerActionPlanner {
    constructor(capabilityRegistry, safetyGuard, config) {
        this.capabilityRegistry = capabilityRegistry;
        this.safetyGuard = safetyGuard;
        this.config = config;
    }
    /**
     * Plan a computer action from a user intent string.
     * Returns a proposed plan — NEVER executes.
     */
    async planFromIntent(userId, tenantId, intent, manualSteps) {
        // Safety check on intent before planning
        this.safetyGuard.assertIntentSafe(intent);
        const steps = manualSteps
            ? this.buildManualSteps(manualSteps)
            : this.inferStepsFromIntent(intent);
        if (steps.length > this.config.maxPlanSteps) {
            throw new Error(`Plan exceeds maximum step count (${this.config.maxPlanSteps}). Break the task into smaller parts.`);
        }
        const overallRiskLevel = this.computeOverallRisk(steps);
        const requiresApproval = this.config.requireApprovalForAll || steps.some((s) => s.requiresApproval);
        const plan = {
            planId: (0, uuid_1.v4)(),
            userId,
            tenantId,
            intent,
            steps,
            overallRiskLevel,
            requiresApproval,
            createdAt: new Date().toISOString(),
            status: 'proposed', // ALWAYS proposed — never auto-executed
        };
        return plan;
    }
    buildManualSteps(manualSteps) {
        return manualSteps.map((ms, i) => {
            const descriptor = this.capabilityRegistry.get(ms.capabilityId);
            if (!descriptor)
                throw new Error(`Unknown capability: ${ms.capabilityId}`);
            // Safety guard check per capability
            this.safetyGuard.assertSafe(ms.capabilityId);
            return {
                stepIndex: i,
                description: ms.description,
                capabilityId: ms.capabilityId,
                riskLevel: descriptor.riskLevel,
                requiresApproval: descriptor.requiresApproval,
                reversible: descriptor.reversible,
                parameters: ms.parameters,
                status: 'pending',
            };
        });
    }
    /**
     * Heuristic intent-to-plan mapping for common task patterns.
     * This is a best-effort inference — real production quality would involve
     * the AI Gateway routing the intent through an LLM-based task decomposer.
     */
    inferStepsFromIntent(intent) {
        const lower = intent.toLowerCase();
        const steps = [];
        if (lower.includes('report') || lower.includes('document') || lower.includes('file')) {
            steps.push(this.step(0, 'uploadFileWithUserPicker', 'Ask user to choose the file via browser file picker'));
            steps.push(this.step(1, 'readVisiblePage', 'Read the uploaded file content (forwarded to Document Intelligence)'));
            steps.push(this.step(2, 'summarizeVisiblePage', 'Summarize the document content'));
            steps.push(this.step(3, 'copyToClipboard', 'Copy the summary to clipboard for user review', { text: '[summary output]' }));
        }
        else if (lower.includes('search') || lower.includes('look up') || lower.includes('find')) {
            const query = intent.replace(/search for|look up|find/gi, '').trim();
            steps.push(this.step(0, 'searchWeb', 'Open a web search for the requested query', { query }));
        }
        else if (lower.includes('open') || lower.includes('navigate')) {
            steps.push(this.step(0, 'openUrl', 'Open the requested URL in the browser', { url: '' }));
        }
        else {
            // Generic fallback: read visible page + summarize
            steps.push(this.step(0, 'readVisiblePage', 'Read the current visible page content'));
            steps.push(this.step(1, 'summarizeVisiblePage', 'Generate a summary of the visible page'));
        }
        return steps;
    }
    step(index, capabilityId, description, parameters) {
        const descriptor = this.capabilityRegistry.get(capabilityId);
        if (!descriptor)
            throw new Error(`Unknown capability: ${capabilityId}`);
        this.safetyGuard.assertSafe(capabilityId);
        return {
            stepIndex: index,
            capabilityId,
            description,
            riskLevel: descriptor.riskLevel,
            requiresApproval: descriptor.requiresApproval,
            reversible: descriptor.reversible,
            parameters,
            status: 'pending',
        };
    }
    /**
     * Delegate file picker plan generation to ComputerFilePickerPlan steps.
     * This method is called by ComputerFilePickerPlan to avoid circular imports.
     *
     * Generates a safe file-picker + analysis plan using manual steps so that
     * every step goes through the same safety guard checks as any other plan.
     */
    async planFilePicker(options) {
        return this.planFromIntent(options.userId, options.tenantId, options.intent || 'Open and analyze a file with ARIA', [
            {
                capabilityId: 'uploadFileWithUserPicker',
                description: 'User selects a file via the browser file picker (user gesture required — no silent access).',
                parameters: {
                    acceptedFileTypes: options.acceptedFileTypes ?? '*/*',
                    note: 'Browser <input type="file"> — user controls file selection entirely.',
                },
            },
            {
                capabilityId: 'readVisiblePage',
                description: 'File content is read from the user-selected file and forwarded to the ARIA Document Intelligence pipeline.',
                parameters: { source: 'browser-file-picker' },
            },
            {
                capabilityId: 'summarizeVisiblePage',
                description: 'AI Gateway generates a summary of the document content.',
                parameters: { via: 'ai-gateway' },
            },
            {
                capabilityId: 'copyToClipboard',
                description: 'Optionally copy the summary to clipboard for user review (requires approval).',
                parameters: { text: '[summary output — provided at execution time]' },
            },
        ]);
    }
    computeOverallRisk(steps) {
        const levels = ['low', 'medium', 'high', 'critical'];
        let maxIndex = 0;
        for (const step of steps) {
            const i = levels.indexOf(step.riskLevel);
            if (i > maxIndex)
                maxIndex = i;
        }
        return levels[maxIndex];
    }
}
exports.ComputerActionPlanner = ComputerActionPlanner;
//# sourceMappingURL=ComputerActionPlanner.js.map