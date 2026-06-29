"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MorningBriefingWorkflow = void 0;
const now = new Date().toISOString();
exports.MorningBriefingWorkflow = {
    id: 'aria.builtin.morning-briefing',
    name: 'Morning Briefing',
    description: 'Generates a personalised morning briefing, prioritises tasks, and notifies the user.',
    version: '1.0.0',
    trigger: { type: 'scheduled', cron: '@morning' },
    enabled: true,
    tags: ['builtin', 'morning', 'briefing'],
    timeoutMs: 120000,
    createdAt: now,
    updatedAt: now,
    steps: [
        {
            id: 'generate-briefing',
            type: 'generate_briefing',
            name: 'Generate Morning Briefing',
            outputKey: 'briefing',
            continueOnError: true,
        },
        {
            id: 'notify-user',
            type: 'notification',
            name: 'Send Briefing Notification',
            title: 'Good morning! Your briefing is ready ☀️',
            body: 'ARIA has prepared your daily briefing. Open the app to review.',
        },
    ],
};
//# sourceMappingURL=MorningBriefingWorkflow.js.map