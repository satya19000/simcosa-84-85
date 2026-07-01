"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerFilePickerPlan = void 0;
/**
 * ComputerFilePickerPlan — generates a safe file picker action plan.
 *
 * Flow:
 * 1. User chooses a file via browser `<input type="file">` — user controls this entirely.
 * 2. File content is sent to analyzeSelectedDocument Cloud Function.
 * 3. ComputerDocumentBridge routes to AI Gateway for summary + action items.
 * 4. Suggested tasks/reminders are displayed — user must approve each one.
 *
 * SAFETY INVARIANTS:
 * - No local file system is ever silently accessed. The browser file picker is
 *   the only entry point — the user must click and select the file manually.
 * - The plan is PROPOSED ONLY — auto-execution is impossible.
 * - Clipboard copy step requires explicit approval (medium risk).
 * - No task or reminder is auto-created — only suggestions are returned.
 *
 * This class delegates to ComputerActionPlanner for plan construction so that
 * all safety guard checks run exactly as they do for any other plan.
 */
class ComputerFilePickerPlan {
    constructor(planner) {
        this.planner = planner;
    }
    /**
     * Generate a safe file picker + analysis plan.
     * Returns a proposed plan — never auto-executes.
     */
    async generatePlan(options) {
        const intent = options.intent || 'Open and analyze a file with ARIA';
        // Use manual steps so each step has explicit capability + description
        return this.planner.planFromIntent(options.userId, options.tenantId, intent, [
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
    /**
     * Description of the file picker plan flow shown to the user before they start.
     */
    static describeFlow() {
        return [
            'Step 1: You choose a file using the browser file picker (you are always in control).',
            'Step 2: ARIA reads the file content you selected.',
            'Step 3: AI Gateway summarizes the document.',
            'Step 4: You review suggested tasks/reminders — nothing is created automatically.',
            'Step 5 (optional): Copy summary to clipboard with your approval.',
        ];
    }
}
exports.ComputerFilePickerPlan = ComputerFilePickerPlan;
//# sourceMappingURL=ComputerFilePickerPlan.js.map