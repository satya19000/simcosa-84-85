"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactFollowUpWorkflow = void 0;
const now = new Date().toISOString();
exports.ContactFollowUpWorkflow = {
    id: 'aria.builtin.contact-follow-up',
    name: 'Contact Follow-Up',
    description: 'Suggests contacts to follow up with based on relationship notes and last interaction.',
    version: '1.0.0',
    trigger: { type: 'scheduled', cron: '@weekly' },
    enabled: true,
    tags: ['builtin', 'contacts', 'relationships'],
    timeoutMs: 60000,
    createdAt: now,
    updatedAt: now,
    steps: [
        {
            id: 'ai-follow-up',
            type: 'run_ai',
            name: 'Identify Follow-Up Contacts',
            prompt: `You are ARIA, an AI executive assistant focused on relationship management.
The user should follow up with key contacts this week. Suggest 2-3 specific follow-up actions based on good relationship hygiene. Be specific and warm. Under 80 words.`,
            maxTokens: 200,
            outputKey: 'followUpSuggestions',
            continueOnError: true,
        },
        {
            id: 'notify-follow-up',
            type: 'notification',
            name: 'Follow-Up Reminder',
            title: '🤝 Weekly relationship check-in',
            body: 'ARIA has identified contacts worth reaching out to this week.',
        },
    ],
};
//# sourceMappingURL=ContactFollowUpWorkflow.js.map