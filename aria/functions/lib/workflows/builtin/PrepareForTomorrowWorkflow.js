"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareForTomorrowWorkflow = void 0;
const now = new Date().toISOString();
exports.PrepareForTomorrowWorkflow = {
    id: 'aria.builtin.prepare-for-tomorrow',
    name: 'Prepare for Tomorrow',
    description: 'Loads upcoming tasks, contacts, and reminders to generate a preparation checklist for tomorrow.',
    version: '1.0.0',
    trigger: { type: 'chat_intent', intentKeywords: ['prepare for tomorrow', 'what do i have tomorrow', 'tomorrow briefing'] },
    enabled: true,
    tags: ['builtin', 'preparation', 'planning'],
    timeoutMs: 120000,
    createdAt: now,
    updatedAt: now,
    steps: [
        {
            id: 'ai-tomorrow-prep',
            type: 'run_ai',
            name: 'Generate Tomorrow Preparation',
            prompt: `You are ARIA, an AI executive assistant. The user wants to prepare for tomorrow.
Generate a concise preparation checklist covering:
1. Key tasks due tomorrow or soon
2. Any meetings or reminders
3. Important contacts to follow up with
4. One productivity tip

Be warm, practical, and under 120 words.`,
            maxTokens: 300,
            outputKey: 'tomorrowPrep',
            continueOnError: true,
        },
        {
            id: 'speak-prep',
            type: 'speak_text',
            name: 'Speak Preparation',
            text: '{{tomorrowPrep}}',
            continueOnError: true,
        },
        {
            id: 'notify-prep',
            type: 'notification',
            name: 'Send Preparation Notification',
            title: "Tomorrow's preparation is ready",
            body: 'ARIA has reviewed your schedule and prepared a checklist for tomorrow.',
        },
    ],
};
//# sourceMappingURL=PrepareForTomorrowWorkflow.js.map