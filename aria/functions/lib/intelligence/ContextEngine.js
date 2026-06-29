"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerContextProvider = registerContextProvider;
exports.buildContext = buildContext;
const contextCache = new Map();
function getCached(key, ttlMs) {
    const entry = contextCache.get(key);
    if (!entry)
        return null;
    if (Date.now() - entry.timestamp > ttlMs) {
        contextCache.delete(key);
        return null;
    }
    return entry.snapshot;
}
function setCached(key, snapshot) {
    contextCache.set(key, { snapshot, timestamp: Date.now() });
}
// ── Provider Registry ────────────────────────────────────────────────────────
const contextProviders = [];
function registerContextProvider(provider) {
    contextProviders.push(provider);
}
// ── Engine ───────────────────────────────────────────────────────────────────
async function buildContext(userId, db, conversationTurns, config) {
    const cacheKey = `ctx:${userId}`;
    const cached = getCached(cacheKey, config.cacheTTLMs);
    if (cached) {
        return { snapshot: { ...cached, conversationTurns }, cacheHit: true };
    }
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const nowIso = now.toISOString();
    const todayEndIso = endOfDay.toISOString();
    const twoHoursIso = twoHoursLater.toISOString();
    // Parallel Firestore reads
    const userRef = db.collection('users').doc(userId);
    const [profileSnap, tasksSnap, remindersSnap, contactsSnap, briefingSnap] = await Promise.all([
        userRef.get(),
        userRef.collection('tasks').where('completed', '==', false).orderBy('createdAt', 'desc').limit(50).get(),
        userRef.collection('reminders').where('completed', '==', false).orderBy('scheduledAt', 'asc').limit(30).get(),
        userRef.collection('contacts').orderBy('updatedAt', 'desc').limit(15).get(),
        userRef.collection('briefings').orderBy('generatedAt', 'desc').limit(1).get(),
    ]);
    // Profile
    const profileData = profileSnap.exists ? (profileSnap.data() ?? {}) : {};
    const userTimezone = profileData['timezone'] ?? config.timezoneFallback;
    const userDisplayName = profileData['displayName'] ?? undefined;
    // Tasks
    const allPendingTasks = tasksSnap.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            title: data['title'] ?? '',
            priority: data['priority'] ?? 'normal',
            dueAt: data['dueAt'] ?? null,
            category: data['category'] ?? null,
            completed: false,
        };
    });
    const overdueTasks = allPendingTasks.filter((t) => t.dueAt && t.dueAt < nowIso);
    const dueTodayTasks = allPendingTasks.filter((t) => t.dueAt && t.dueAt >= nowIso && t.dueAt <= todayEndIso);
    const dueNextTwoHoursTasks = allPendingTasks.filter((t) => t.dueAt && t.dueAt >= nowIso && t.dueAt <= twoHoursIso);
    const highPriorityTasks = allPendingTasks.filter((t) => t.priority === 'high' || t.priority === 'critical');
    // Reminders
    const allPendingReminders = remindersSnap.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            title: data['title'] ?? '',
            scheduledAt: data['scheduledAt'] ?? '',
            recurrence: data['recurrence'] ?? 'none',
            completed: false,
        };
    });
    const overdueReminders = allPendingReminders.filter((r) => r.scheduledAt < nowIso);
    const todayReminders = allPendingReminders.filter((r) => r.scheduledAt >= nowIso && r.scheduledAt <= todayEndIso);
    const imminentReminders = allPendingReminders.filter((r) => r.scheduledAt >= nowIso && r.scheduledAt <= twoHoursIso);
    // Contacts
    const recentContacts = contactsSnap.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            name: data['name'] ?? '',
            relationshipType: data['relationshipType'] ?? null,
            role: data['role'] ?? null,
            organization: data['organization'] ?? null,
            preferredContactMethod: data['preferredContactMethod'] ?? 'unknown',
            phone: data['phone'] ?? null,
            email: data['email'] ?? null,
            relationshipNotes: data['relationshipNotes'] ?? null,
        };
    });
    // Briefing
    const latestBriefing = briefingSnap.empty
        ? null
        : (() => {
            const data = briefingSnap.docs[0].data();
            return {
                briefingId: data['briefingId'] ?? briefingSnap.docs[0].id,
                summary: data['summary'] ?? '',
                generatedAt: data['generatedAt'] ?? '',
            };
        })();
    // Run any registered extra providers in parallel
    const extraPartials = contextProviders.length > 0
        ? await Promise.all(contextProviders.map((p) => p.load(userId, db)))
        : [];
    const extraMerged = extraPartials.reduce((acc, p) => ({ ...acc, ...p }), {});
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: userTimezone });
    const dateFull = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: userTimezone,
    });
    const snapshot = {
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
    };
    snapshot.sizeChars = JSON.stringify(snapshot).length;
    setCached(cacheKey, snapshot);
    return { snapshot, cacheHit: false };
}
//# sourceMappingURL=ContextEngine.js.map