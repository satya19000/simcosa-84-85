"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderEscalationWorkflow = void 0;
const now = new Date().toISOString();
exports.ReminderEscalationWorkflow = {
    id: 'aria.builtin.reminder-escalation',
    name: 'Reminder Escalation',
    description: 'Escalates an unacknowledged reminder with a follow-up notification.',
    version: '1.0.0',
    trigger: { type: 'reminder_triggered' },
    enabled: true,
    tags: ['builtin', 'reminders', 'escalation'],
    timeoutMs: 30000,
    createdAt: now,
    updatedAt: now,
    steps: [
        {
            id: 'escalate-notify',
            type: 'notification',
            name: 'Escalation Notification',
            title: '🔔 Reminder follow-up',
            body: 'This reminder has not been acknowledged. Please review your reminders.',
        },
    ],
};
//# sourceMappingURL=ReminderEscalationWorkflow.js.map