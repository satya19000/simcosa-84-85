import type { AgentCapability } from './AgentTypes'

/** Firestore paths an agent is allowed to read. */
export type FirestoreReadScope =
  | 'users/{uid}/tasks'
  | 'users/{uid}/reminders'
  | 'users/{uid}/contacts'
  | 'users/{uid}/briefings'
  | 'users/{uid}/chatSessions'
  | 'users/{uid}/workflowHistory'
  | 'users/{uid}/plugins'

/** Actions an agent is permitted to invoke on the ActionEngine. */
export type ActionScope =
  | 'createTask'
  | 'updateTask'
  | 'completeTask'
  | 'deleteTask'
  | 'createReminder'
  | 'updateReminder'
  | 'deleteReminder'
  | 'createContact'
  | 'updateContact'
  | 'deleteContact'
  | 'addRelationshipNote'
  | 'searchContacts'

export interface AgentPermissionSet {
  canRead: FirestoreReadScope[]
  canWrite: ActionScope[]
  canCallAI: boolean
  canSendNotifications: boolean
  canRunWorkflows: boolean
}

/** Default permission sets per capability — enforced by AgentManager before dispatch. */
export const CAPABILITY_PERMISSIONS: Record<AgentCapability, AgentPermissionSet> = {
  plan: {
    canRead: ['users/{uid}/tasks', 'users/{uid}/reminders', 'users/{uid}/contacts', 'users/{uid}/briefings'],
    canWrite: [],
    canCallAI: true,
    canSendNotifications: false,
    canRunWorkflows: false,
  },
  calendar: {
    canRead: ['users/{uid}/reminders'],
    canWrite: ['createReminder', 'updateReminder', 'deleteReminder'],
    canCallAI: false,
    canSendNotifications: false,
    canRunWorkflows: false,
  },
  tasks: {
    canRead: ['users/{uid}/tasks'],
    canWrite: ['createTask', 'updateTask', 'completeTask', 'deleteTask'],
    canCallAI: false,
    canSendNotifications: false,
    canRunWorkflows: false,
  },
  reminders: {
    canRead: ['users/{uid}/reminders'],
    canWrite: ['createReminder', 'updateReminder', 'deleteReminder'],
    canCallAI: false,
    canSendNotifications: false,
    canRunWorkflows: false,
  },
  contacts: {
    canRead: ['users/{uid}/contacts'],
    canWrite: ['createContact', 'updateContact', 'deleteContact', 'addRelationshipNote', 'searchContacts'],
    canCallAI: false,
    canSendNotifications: false,
    canRunWorkflows: false,
  },
  memory: {
    canRead: ['users/{uid}/tasks', 'users/{uid}/reminders', 'users/{uid}/contacts', 'users/{uid}/briefings', 'users/{uid}/chatSessions'],
    canWrite: [],
    canCallAI: false,
    canSendNotifications: false,
    canRunWorkflows: false,
  },
  workflow: {
    canRead: ['users/{uid}/workflowHistory'],
    canWrite: [],
    canCallAI: false,
    canSendNotifications: false,
    canRunWorkflows: true,
  },
  notification: {
    canRead: [],
    canWrite: [],
    canCallAI: false,
    canSendNotifications: true,
    canRunWorkflows: false,
  },
  voice: {
    canRead: [],
    canWrite: [],
    canCallAI: true,
    canSendNotifications: false,
    canRunWorkflows: false,
  },
  briefing: {
    canRead: ['users/{uid}/tasks', 'users/{uid}/reminders', 'users/{uid}/contacts', 'users/{uid}/briefings'],
    canWrite: [],
    canCallAI: true,
    canSendNotifications: true,
    canRunWorkflows: false,
  },
  knowledge: {
    canRead: ['users/{uid}/chatSessions'],
    canWrite: [],
    canCallAI: true,
    canSendNotifications: false,
    canRunWorkflows: false,
  },
  search: {
    canRead: ['users/{uid}/tasks', 'users/{uid}/reminders', 'users/{uid}/contacts'],
    canWrite: ['searchContacts'],
    canCallAI: false,
    canSendNotifications: false,
    canRunWorkflows: false,
  },
  validation: {
    canRead: [],
    canWrite: [],
    canCallAI: true,
    canSendNotifications: false,
    canRunWorkflows: false,
  },
  // Placeholder capabilities — not implemented yet
  email:       { canRead: [], canWrite: [], canCallAI: false, canSendNotifications: false, canRunWorkflows: false },
  whatsapp:    { canRead: [], canWrite: [], canCallAI: false, canSendNotifications: false, canRunWorkflows: false },
  maps:        { canRead: [], canWrite: [], canCallAI: false, canSendNotifications: false, canRunWorkflows: false },
  finance:     { canRead: [], canWrite: [], canCallAI: false, canSendNotifications: false, canRunWorkflows: false },
  health:      { canRead: [], canWrite: [], canCallAI: false, canSendNotifications: false, canRunWorkflows: false },
  document:    { canRead: [], canWrite: [], canCallAI: false, canSendNotifications: false, canRunWorkflows: false },
  ocr:         { canRead: [], canWrite: [], canCallAI: false, canSendNotifications: false, canRunWorkflows: false },
  automation:  { canRead: [], canWrite: [], canCallAI: false, canSendNotifications: false, canRunWorkflows: false },
}

export function getPermissions(capability: AgentCapability): AgentPermissionSet {
  return CAPABILITY_PERMISSIONS[capability]
}
