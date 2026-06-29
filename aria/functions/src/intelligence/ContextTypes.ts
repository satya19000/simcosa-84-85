import type * as admin from 'firebase-admin'

// ── Lightweight summary shapes ──────────────────────────────────────────────

export interface TaskSummary {
  id: string
  title: string
  priority: string
  dueAt: string | null
  category: string | null
  completed: boolean
}

export interface ReminderSummary {
  id: string
  title: string
  scheduledAt: string
  recurrence: string
  completed: boolean
}

export interface ContactSummary {
  id: string
  name: string
  relationshipType: string | null
  role: string | null
  organization: string | null
  preferredContactMethod: string
  phone: string | null
  email: string | null
  relationshipNotes: string | null
}

export interface BriefingSummary {
  briefingId: string
  summary: string
  generatedAt: string
}

// ── Context Snapshot ─────────────────────────────────────────────────────────

export interface ContextSnapshot {
  userId: string
  userDisplayName: string | undefined
  userTimezone: string
  timestamp: string
  dayOfWeek: string
  dateFull: string

  // Tasks
  allPendingTasks: TaskSummary[]
  overdueTasks: TaskSummary[]
  dueTodayTasks: TaskSummary[]
  dueNextTwoHoursTasks: TaskSummary[]
  highPriorityTasks: TaskSummary[]

  // Reminders
  allPendingReminders: ReminderSummary[]
  overdueReminders: ReminderSummary[]
  todayReminders: ReminderSummary[]
  imminentReminders: ReminderSummary[]

  // Contacts
  recentContacts: ContactSummary[]

  // Briefing
  latestBriefing: BriefingSummary | null

  // Session
  conversationTurns: number
  voiceModeEnabled: boolean

  // Estimated size for budget tracking
  sizeChars: number
}

// ── Provider Interface ───────────────────────────────────────────────────────

export interface ContextProvider {
  readonly name: string
  load(
    userId: string,
    db: admin.firestore.Firestore
  ): Promise<Partial<ContextSnapshot>>
}
