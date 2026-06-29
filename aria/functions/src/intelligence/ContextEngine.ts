import type * as admin from 'firebase-admin'
import type { ContextSnapshot, ContextProvider } from './ContextTypes'
import type { EngineConfig } from './EngineConfig'

// ── In-memory cache ──────────────────────────────────────────────────────────

interface CacheEntry {
  snapshot: ContextSnapshot
  timestamp: number
}

const contextCache = new Map<string, CacheEntry>()

function getCached(key: string, ttlMs: number): ContextSnapshot | null {
  const entry = contextCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > ttlMs) {
    contextCache.delete(key)
    return null
  }
  return entry.snapshot
}

function setCached(key: string, snapshot: ContextSnapshot): void {
  contextCache.set(key, { snapshot, timestamp: Date.now() })
}

// ── Provider Registry ────────────────────────────────────────────────────────

const contextProviders: ContextProvider[] = []

export function registerContextProvider(provider: ContextProvider): void {
  contextProviders.push(provider)
}

// ── Engine ───────────────────────────────────────────────────────────────────

export async function buildContext(
  userId: string,
  db: admin.firestore.Firestore,
  conversationTurns: number,
  config: EngineConfig
): Promise<{ snapshot: ContextSnapshot; cacheHit: boolean }> {
  const cacheKey = `ctx:${userId}`
  const cached = getCached(cacheKey, config.cacheTTLMs)
  if (cached) {
    return { snapshot: { ...cached, conversationTurns }, cacheHit: true }
  }

  const now = new Date()
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)
  const nowIso = now.toISOString()
  const todayEndIso = endOfDay.toISOString()
  const twoHoursIso = twoHoursLater.toISOString()

  // Parallel Firestore reads
  const userRef = db.collection('users').doc(userId)

  const [profileSnap, tasksSnap, remindersSnap, contactsSnap, briefingSnap] =
    await Promise.all([
      userRef.get(),
      userRef.collection('tasks').where('completed', '==', false).orderBy('createdAt', 'desc').limit(50).get(),
      userRef.collection('reminders').where('completed', '==', false).orderBy('scheduledAt', 'asc').limit(30).get(),
      userRef.collection('contacts').orderBy('updatedAt', 'desc').limit(15).get(),
      userRef.collection('briefings').orderBy('generatedAt', 'desc').limit(1).get(),
    ])

  // Profile
  const profileData = profileSnap.exists ? (profileSnap.data() ?? {}) : {}
  const userTimezone = (profileData['timezone'] as string | undefined) ?? config.timezoneFallback
  const userDisplayName =
    (profileData['displayName'] as string | undefined) ?? undefined

  // Tasks
  const allPendingTasks = tasksSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      title: (data['title'] as string) ?? '',
      priority: (data['priority'] as string) ?? 'normal',
      dueAt: (data['dueAt'] as string | null) ?? null,
      category: (data['category'] as string | null) ?? null,
      completed: false,
    }
  })

  const overdueTasks = allPendingTasks.filter((t) => t.dueAt && t.dueAt < nowIso)
  const dueTodayTasks = allPendingTasks.filter(
    (t) => t.dueAt && t.dueAt >= nowIso && t.dueAt <= todayEndIso
  )
  const dueNextTwoHoursTasks = allPendingTasks.filter(
    (t) => t.dueAt && t.dueAt >= nowIso && t.dueAt <= twoHoursIso
  )
  const highPriorityTasks = allPendingTasks.filter(
    (t) => t.priority === 'high' || t.priority === 'critical'
  )

  // Reminders
  const allPendingReminders = remindersSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      title: (data['title'] as string) ?? '',
      scheduledAt: (data['scheduledAt'] as string) ?? '',
      recurrence: (data['recurrence'] as string) ?? 'none',
      completed: false,
    }
  })

  const overdueReminders = allPendingReminders.filter((r) => r.scheduledAt < nowIso)
  const todayReminders = allPendingReminders.filter(
    (r) => r.scheduledAt >= nowIso && r.scheduledAt <= todayEndIso
  )
  const imminentReminders = allPendingReminders.filter(
    (r) => r.scheduledAt >= nowIso && r.scheduledAt <= twoHoursIso
  )

  // Contacts
  const recentContacts = contactsSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      name: (data['name'] as string) ?? '',
      relationshipType: (data['relationshipType'] as string | null) ?? null,
      role: (data['role'] as string | null) ?? null,
      organization: (data['organization'] as string | null) ?? null,
      preferredContactMethod: (data['preferredContactMethod'] as string) ?? 'unknown',
      phone: (data['phone'] as string | null) ?? null,
      email: (data['email'] as string | null) ?? null,
      relationshipNotes: (data['relationshipNotes'] as string | null) ?? null,
    }
  })

  // Briefing
  const latestBriefing = briefingSnap.empty
    ? null
    : (() => {
        const data = briefingSnap.docs[0].data()
        return {
          briefingId: (data['briefingId'] as string) ?? briefingSnap.docs[0].id,
          summary: (data['summary'] as string) ?? '',
          generatedAt: (data['generatedAt'] as string) ?? '',
        }
      })()

  // Run any registered extra providers in parallel
  const extraPartials = contextProviders.length > 0
    ? await Promise.all(contextProviders.map((p) => p.load(userId, db)))
    : []

  const extraMerged = extraPartials.reduce<Partial<ContextSnapshot>>(
    (acc, p) => ({ ...acc, ...p }),
    {}
  )

  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: userTimezone })
  const dateFull = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: userTimezone,
  })

  const snapshot: ContextSnapshot = {
    userId,
    userDisplayName,
    userTimezone,
    timestamp: nowIso,
    dayOfWeek,
    dateFull,
    allPendingTasks,
    overdueTasks,
    dueTodayTasks,
    dueNextTwoHoursTasks,
    highPriorityTasks,
    allPendingReminders,
    overdueReminders,
    todayReminders,
    imminentReminders,
    recentContacts,
    latestBriefing,
    conversationTurns,
    voiceModeEnabled: false,
    sizeChars: 0,
    ...extraMerged,
  }

  snapshot.sizeChars = JSON.stringify(snapshot).length
  setCached(cacheKey, snapshot)

  return { snapshot, cacheHit: false }
}
