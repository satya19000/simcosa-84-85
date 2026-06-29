"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMemoryProvider = registerMemoryProvider;
exports.buildMemory = buildMemory;
const PriorityEngine_1 = require("./PriorityEngine");
const memoryCache = new Map();
function getCached(key, ttlMs) {
    const entry = memoryCache.get(key);
    if (!entry)
        return null;
    if (Date.now() - entry.timestamp > ttlMs) {
        memoryCache.delete(key);
        return null;
    }
    return entry.blocks;
}
function setCached(key, blocks) {
    memoryCache.set(key, { blocks, timestamp: Date.now() });
}
// ── Provider Registry ────────────────────────────────────────────────────────
const memoryProviders = [];
function registerMemoryProvider(provider) {
    memoryProviders.push(provider);
}
// ── Built-in Providers ───────────────────────────────────────────────────────
function buildTasksBlock(context) {
    const nowIso = new Date().toISOString();
    const ranked = (0, PriorityEngine_1.rankTasks)(context.allPendingTasks, nowIso).slice(0, 10);
    const lines = [];
    if (context.overdueTasks.length > 0) {
        lines.push(`OVERDUE (${context.overdueTasks.length}): ${context.overdueTasks.map((t) => `"${t.title}" [${t.priority}]`).join(', ')}`);
    }
    if (context.dueTodayTasks.length > 0) {
        lines.push(`TODAY (${context.dueTodayTasks.length}): ${context.dueTodayTasks.map((t) => `"${t.title}" [${t.priority}]`).join(', ')}`);
    }
    const otherHighPriority = ranked.filter((t) => !context.overdueTasks.find((o) => o.id === t.id) && !context.dueTodayTasks.find((d) => d.id === t.id)).filter((t) => t.priority === 'high' || t.priority === 'critical').slice(0, 3);
    if (otherHighPriority.length > 0) {
        lines.push(`HIGH PRIORITY: ${otherHighPriority.map((t) => `"${t.title}"`).join(', ')}`);
    }
    if (lines.length === 0) {
        lines.push(`${context.allPendingTasks.length} pending task${context.allPendingTasks.length !== 1 ? 's' : ''}`);
    }
    const summary = `Tasks (${context.allPendingTasks.length} pending):\n${lines.join('\n')}`;
    const urgency = context.overdueTasks.length > 0 ? 80
        : context.dueTodayTasks.length > 0 ? 60
            : context.highPriorityTasks.length > 0 ? 40
                : context.allPendingTasks.length > 0 ? 20
                    : 0;
    return {
        type: 'tasks',
        title: 'Tasks',
        summary,
        priority: urgency,
        sizeChars: summary.length,
        data: { tasks: ranked, overdue: context.overdueTasks.length, today: context.dueTodayTasks.length },
    };
}
function buildRemindersBlock(context) {
    const lines = [];
    if (context.imminentReminders.length > 0) {
        lines.push(`NEXT 2H: ${context.imminentReminders.map((r) => `"${r.title}" at ${formatTime(r.scheduledAt)}`).join(', ')}`);
    }
    if (context.todayReminders.length > 0 && context.imminentReminders.length === 0) {
        lines.push(`TODAY: ${context.todayReminders.map((r) => `"${r.title}" at ${formatTime(r.scheduledAt)}`).join(', ')}`);
    }
    if (context.overdueReminders.length > 0) {
        lines.push(`MISSED: ${context.overdueReminders.map((r) => `"${r.title}"`).join(', ')}`);
    }
    if (lines.length === 0) {
        lines.push(`${context.allPendingReminders.length} upcoming reminder${context.allPendingReminders.length !== 1 ? 's' : ''}`);
    }
    const summary = `Reminders:\n${lines.join('\n')}`;
    const urgency = context.overdueReminders.length > 0 ? 75
        : context.imminentReminders.length > 0 ? 65
            : context.todayReminders.length > 0 ? 45
                : 15;
    return {
        type: 'reminders',
        title: 'Reminders',
        summary,
        priority: urgency,
        sizeChars: summary.length,
        data: {
            imminent: context.imminentReminders,
            today: context.todayReminders,
            overdue: context.overdueReminders,
        },
    };
}
function buildContactsBlock(context, messageLower) {
    const ranked = (0, PriorityEngine_1.rankContacts)(context.recentContacts, messageLower);
    const lines = ranked.map((c) => {
        const parts = [c.name];
        if (c.relationshipType)
            parts.push(c.relationshipType);
        if (c.role)
            parts.push(c.role);
        if (c.organization)
            parts.push(c.organization);
        if (c.preferredContactMethod && c.preferredContactMethod !== 'unknown') {
            parts.push(`prefers ${c.preferredContactMethod}`);
        }
        if (c.phone)
            parts.push(`ph:${c.phone}`);
        if (c.email)
            parts.push(`email:${c.email}`);
        const isNamed = messageLower.includes(c.name.toLowerCase());
        if (isNamed && c.relationshipNotes) {
            parts.push(`notes: ${c.relationshipNotes.slice(0, 250)}`);
        }
        return `• ${parts.join(' — ')} [id:${c.id}]`;
    });
    const namedCount = ranked.filter((c) => messageLower.includes(c.name.toLowerCase())).length;
    const hasNamedContact = namedCount > 0;
    const summary = `Contacts (use contactId from [id:…] when calling contact tools):\n${lines.join('\n')}`;
    return {
        type: 'contacts',
        title: 'Contacts',
        summary: lines.length > 0 ? summary : 'No contacts saved yet.',
        priority: hasNamedContact ? 70 : 25,
        sizeChars: summary.length,
        data: { contacts: ranked, namedCount },
    };
}
function buildBriefingBlock(context) {
    if (!context.latestBriefing)
        return null;
    const ageMs = Date.now() - new Date(context.latestBriefing.generatedAt).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    if (ageHours > 24)
        return null;
    const summary = `Today's briefing (${formatTime(context.latestBriefing.generatedAt)}): ${context.latestBriefing.summary}`;
    return {
        type: 'briefing',
        title: 'Daily Briefing',
        summary,
        priority: 35,
        sizeChars: summary.length,
        data: { briefing: context.latestBriefing, ageHours },
    };
}
// ── Engine ───────────────────────────────────────────────────────────────────
async function buildMemory(userId, db, context, message, config) {
    const messageLower = message.toLowerCase();
    let cacheHits = 0;
    let cacheMisses = 0;
    // Collect blocks from registered external providers (parallelized + cached)
    const externalBlockArrays = await Promise.all(memoryProviders.map(async (provider) => {
        const cacheKey = `mem:${userId}:${provider.name}`;
        const cached = getCached(cacheKey, config.cacheTTLMs);
        if (cached) {
            cacheHits++;
            return cached;
        }
        cacheMisses++;
        const blocks = await provider.load(userId, db, message);
        setCached(cacheKey, blocks);
        return blocks;
    }));
    // Built-in blocks (derived from context — no extra Firestore reads)
    const builtIn = [];
    const tasksBlock = buildTasksBlock(context);
    if (context.allPendingTasks.length > 0)
        builtIn.push(tasksBlock);
    const remindersBlock = buildRemindersBlock(context);
    if (context.allPendingReminders.length > 0)
        builtIn.push(remindersBlock);
    const contactsBlock = buildContactsBlock(context, messageLower);
    if (context.recentContacts.length > 0)
        builtIn.push(contactsBlock);
    const briefingBlock = buildBriefingBlock(context);
    if (briefingBlock)
        builtIn.push(briefingBlock);
    // Merge and deduplicate by type
    const external = externalBlockArrays.flat();
    const allBlocks = [...builtIn, ...external];
    // Sort by priority descending, trim to limit
    allBlocks.sort((a, b) => b.priority - a.priority);
    return {
        blocks: allBlocks.slice(0, config.maxMemoryBlocks),
        cacheHits,
        cacheMisses,
    };
}
// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(iso) {
    try {
        return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    catch {
        return iso;
    }
}
//# sourceMappingURL=MemoryEngine.js.map