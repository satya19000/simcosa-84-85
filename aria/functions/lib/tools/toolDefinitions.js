"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ARIA_TOOL_NAMES = exports.ARIA_TOOLS = void 0;
exports.isAriaTool = isAriaTool;
/**
 * Single source of truth for every Claude tool definition.
 *
 * Schemas here must stay in sync with the Action Engine's validate() methods.
 * When you add a new action: add its tool definition here, then import this file
 * wherever Claude is configured — nowhere else needs changing.
 */
const createTaskTool = {
    name: 'createTask',
    description: 'Creates a task for the user. Use this when the user wants to add a to-do, action item, or work item. ' +
        'Always resolve relative dates (today, tomorrow, next Friday) to a full ISO-8601 datetime before calling. ' +
        'If no due date is mentioned, omit the dueAt field.',
    input_schema: {
        type: 'object',
        properties: {
            title: {
                type: 'string',
                description: 'Short, clear description of the task (max 200 chars).',
            },
            priority: {
                type: 'string',
                enum: ['low', 'normal', 'high', 'critical'],
                description: 'Task priority. Default: normal.',
            },
            dueAt: {
                type: 'string',
                description: 'ISO-8601 datetime for the task deadline, e.g. 2026-07-01T17:00:00+05:30. ' +
                    'Always include timezone offset. Omit if not mentioned.',
            },
            category: {
                type: 'string',
                description: 'Optional category label, e.g. Work, Personal, Health, Finance.',
            },
            notes: {
                type: 'string',
                description: 'Optional additional context for the task.',
            },
        },
        required: ['title'],
    },
};
const createReminderTool = {
    name: 'createReminder',
    description: 'Creates a timed reminder for the user. Use this when the user says "remind me", ' +
        '"alert me", "notify me" or similar. ' +
        'You MUST resolve the exact datetime before calling — never call with a vague time. ' +
        'If the user says just "tomorrow" without a time, ask what time first.',
    input_schema: {
        type: 'object',
        properties: {
            title: {
                type: 'string',
                description: 'What to remind the user about (max 200 chars).',
            },
            scheduledAt: {
                type: 'string',
                description: 'ISO-8601 datetime for when to fire the reminder, e.g. 2026-07-01T10:00:00+05:30. ' +
                    'Always include timezone offset. This field is required.',
            },
            recurrence: {
                type: 'string',
                enum: ['none', 'daily', 'weekly', 'monthly'],
                description: 'How often to repeat. Default: none.',
            },
            notes: {
                type: 'string',
                description: 'Optional extra context for the reminder.',
            },
        },
        required: ['title', 'scheduledAt'],
    },
};
/** All tools exposed to Claude in this phase. */
exports.ARIA_TOOLS = [createTaskTool, createReminderTool];
/** Tool names as a const tuple for type-safe lookups. */
exports.ARIA_TOOL_NAMES = ['createTask', 'createReminder'];
/** Returns true if the given string is a registered ARIA tool name. */
function isAriaTool(name) {
    return exports.ARIA_TOOL_NAMES.includes(name);
}
//# sourceMappingURL=toolDefinitions.js.map