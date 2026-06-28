import type Anthropic from '@anthropic-ai/sdk'

/**
 * Single source of truth for every Claude tool definition.
 *
 * Schemas here must stay in sync with the Action Engine's validate() methods.
 * When you add a new action: add its tool definition here, then import this file
 * wherever Claude is configured — nowhere else needs changing.
 */

const createTaskTool: Anthropic.Tool = {
  name: 'createTask',
  description:
    'Creates a task for the user. Use this when the user wants to add a to-do, action item, or work item. ' +
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
        description:
          'ISO-8601 datetime for the task deadline, e.g. 2026-07-01T17:00:00+05:30. ' +
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
}

const createReminderTool: Anthropic.Tool = {
  name: 'createReminder',
  description:
    'Creates a timed reminder for the user. Use this when the user says "remind me", ' +
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
        description:
          'ISO-8601 datetime for when to fire the reminder, e.g. 2026-07-01T10:00:00+05:30. ' +
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
}

const createContactTool: Anthropic.Tool = {
  name: 'createContact',
  description:
    'Saves a new contact or person to the user\'s relationship memory. ' +
    'Use this when the user says "save", "remember", "add contact", "this is my friend/colleague/doctor", ' +
    '"note that [name] is [role/relation]", or provides a person\'s details to store. ' +
    'If the user says "remember Rahul is my college friend", save Rahul as a contact with relationshipType="college friend".',
  input_schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Full name of the contact (required, max 100 chars).',
      },
      phone: {
        type: 'string',
        description: 'Phone number, if provided.',
      },
      email: {
        type: 'string',
        description: 'Email address, if provided.',
      },
      role: {
        type: 'string',
        description: 'Job title or role, e.g. "Medical Officer", "District Collector".',
      },
      organization: {
        type: 'string',
        description: 'Employer or organization name, e.g. "DMHO Office".',
      },
      relationshipType: {
        type: 'string',
        description: 'How this person relates to the user, e.g. "college friend", "cousin", "client", "doctor".',
      },
      relationshipNotes: {
        type: 'string',
        description: 'Any relationship notes or context provided by the user.',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional tags for grouping contacts, e.g. ["health", "government"].',
      },
      preferredContactMethod: {
        type: 'string',
        enum: ['phone', 'whatsapp', 'email', 'sms', 'unknown'],
        description: 'How this person prefers to be contacted.',
      },
    },
    required: ['name'],
  },
}

const updateContactTool: Anthropic.Tool = {
  name: 'updateContact',
  description:
    'Updates an existing contact\'s details. Requires the contactId. ' +
    'Use searchContacts first if you don\'t have the contactId. ' +
    'Use this when the user wants to change a contact\'s phone number, email, role, notes, etc.',
  input_schema: {
    type: 'object',
    properties: {
      contactId: {
        type: 'string',
        description: 'Firestore document ID of the contact to update.',
      },
      name: { type: 'string', description: 'Updated name.' },
      phone: { type: 'string', description: 'Updated phone number.' },
      email: { type: 'string', description: 'Updated email.' },
      role: { type: 'string', description: 'Updated role/title.' },
      organization: { type: 'string', description: 'Updated organization.' },
      relationshipType: { type: 'string', description: 'Updated relationship type.' },
      relationshipNotes: { type: 'string', description: 'Updated relationship notes.' },
      tags: { type: 'array', items: { type: 'string' }, description: 'Updated tags.' },
      preferredContactMethod: {
        type: 'string',
        enum: ['phone', 'whatsapp', 'email', 'sms', 'unknown'],
      },
    },
    required: ['contactId'],
  },
}

const deleteContactTool: Anthropic.Tool = {
  name: 'deleteContact',
  description: 'Permanently deletes a contact. Requires the contactId.',
  input_schema: {
    type: 'object',
    properties: {
      contactId: {
        type: 'string',
        description: 'Firestore document ID of the contact to delete.',
      },
    },
    required: ['contactId'],
  },
}

const addRelationshipNoteTool: Anthropic.Tool = {
  name: 'addRelationshipNote',
  description:
    'Adds a note or memory about a person to their contact record. ' +
    'Use this when the user says things like "remember that Rahul prefers WhatsApp", ' +
    '"add note: Priya is vegetarian", or "note about Dr. Rao: very responsive on email". ' +
    'Provide either contactId OR contactName (name lookup is automatic).',
  input_schema: {
    type: 'object',
    properties: {
      contactId: {
        type: 'string',
        description: 'Firestore document ID of the contact (preferred if known).',
      },
      contactName: {
        type: 'string',
        description: 'Name of the contact (used to look up contactId if contactId is unknown).',
      },
      note: {
        type: 'string',
        description: 'The relationship note or memory to record (max 2000 chars).',
      },
      importance: {
        type: 'string',
        enum: ['low', 'normal', 'high'],
        description: 'How important this note is. Default: normal.',
      },
      source: {
        type: 'string',
        enum: ['chat', 'manual', 'call', 'meeting'],
        description: 'Where this note originated. Default: chat.',
      },
    },
    required: ['note'],
  },
}

const searchContactsTool: Anthropic.Tool = {
  name: 'searchContacts',
  description:
    'Searches the user\'s contacts by name, role, organization, relationship type, or tags. ' +
    'Use this when the user asks "who is [name]?", "find my doctor contact", "show contacts from DMHO", ' +
    '"get Rahul\'s number", or when you need a contactId before updating or adding a note.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search term to match against name, role, organization, tags, relationship type, or notes.',
      },
    },
    required: ['query'],
  },
}

/** All tools exposed to Claude. */
export const ARIA_TOOLS: Anthropic.Tool[] = [
  createTaskTool,
  createReminderTool,
  createContactTool,
  updateContactTool,
  deleteContactTool,
  addRelationshipNoteTool,
  searchContactsTool,
]

export const ARIA_TOOL_NAMES = [
  'createTask',
  'createReminder',
  'createContact',
  'updateContact',
  'deleteContact',
  'addRelationshipNote',
  'searchContacts',
] as const
export type AriaToolName = typeof ARIA_TOOL_NAMES[number]

export function isAriaTool(name: string): name is AriaToolName {
  return (ARIA_TOOL_NAMES as readonly string[]).includes(name)
}
