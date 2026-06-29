"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverdueTaskRecoveryWorkflow = void 0;
const now = new Date().toISOString();
exports.OverdueTaskRecoveryWorkflow = {
    id: 'aria.builtin.overdue-task-recovery',
    name: 'Overdue Task Recovery',
    description: 'Detects overdue tasks and notifies the user with a recovery plan.',
    version: '1.0.0',
    trigger: { type: 'scheduled', cron: '@daily' },
    enabled: true,
    tags: ['builtin', 'tasks', 'recovery'],
    timeoutMs: 60000,
    createdAt: now,
    updatedAt: now,
    steps: [
        {
            id: 'ai-recovery',
            type: 'run_ai',
            name: 'Generate Recovery Suggestions',
            prompt: `You are ARIA, an AI executive assistant. The user has overdue tasks.
Generate 3 brief, actionable recovery suggestions. Be encouraging and direct. Under 80 words.`,
            maxTokens: 200,
            outputKey: 'recoverySuggestions',
            continueOnError: true,
        },
        {
            id: 'notify-overdue',
            type: 'notification',
            name: 'Notify About Overdue Tasks',
            title: '⚠️ You have overdue tasks',
            body: 'ARIA has prepared recovery suggestions to help you get back on track.',
        },
    ],
};
//# sourceMappingURL=OverdueTaskRecoveryWorkflow.js.map