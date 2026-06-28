"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDailyBriefing = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const uuid_1 = require("uuid");
const anthropicApiKey = (0, params_1.defineSecret)('ANTHROPIC_API_KEY');
exports.generateDailyBriefing = (0, https_1.onCall)({ secrets: [anthropicApiKey], timeoutSeconds: 60, memory: '512MiB' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
    }
    const userId = request.auth.uid;
    const timezone = request.data.timezone ?? 'UTC';
    const db = admin.firestore();
    const now = new Date();
    const [tasksSnap, remindersSnap, contactsSnap] = await Promise.all([
        db.collection('users').doc(userId).collection('tasks')
            .where('completed', '==', false)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get(),
        db.collection('users').doc(userId).collection('reminders')
            .where('completed', '==', false)
            .orderBy('scheduledAt', 'asc')
            .limit(20)
            .get(),
        db.collection('users').doc(userId).collection('contacts')
            .orderBy('updatedAt', 'desc')
            .limit(10)
            .get(),
    ]);
    const tasks = tasksSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const reminders = remindersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const contacts = contactsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const nowIso = now.toISOString();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const endOfDayIso = endOfDay.toISOString();
    const overdueTasks = tasks.filter((t) => t.dueAt && t.dueAt < nowIso);
    const todayTasks = tasks.filter((t) => t.dueAt && t.dueAt >= nowIso && t.dueAt <= endOfDayIso);
    const highPriority = tasks.filter((t) => t.priority === 'high' || t.priority === 'critical');
    const todayReminders = reminders.filter((r) => r.scheduledAt <= endOfDayIso);
    const imminent = reminders.filter((r) => r.scheduledAt >= nowIso && r.scheduledAt <= twoHoursFromNow);
    const contextBlock = [
        `Current time: ${now.toLocaleString('en-US', { timeZone: timezone, dateStyle: 'full', timeStyle: 'short' })}`,
        `Timezone: ${timezone}`,
        '',
        `PENDING TASKS (${tasks.length} total):`,
        overdueTasks.length > 0 ? `  OVERDUE (${overdueTasks.length}): ${overdueTasks.map((t) => `"${t.title}" [${t.priority}]`).join(', ')}` : '  No overdue tasks',
        todayTasks.length > 0 ? `  DUE TODAY (${todayTasks.length}): ${todayTasks.map((t) => `"${t.title}" [${t.priority}]`).join(', ')}` : '  Nothing due today',
        highPriority.length > 0 ? `  HIGH PRIORITY: ${highPriority.map((t) => `"${t.title}"`).join(', ')}` : '  No high-priority items',
        '',
        `REMINDERS (${reminders.length} total):`,
        imminent.length > 0 ? `  NEXT 2 HOURS: ${imminent.map((r) => `"${r.title}" at ${r.scheduledAt}`).join(', ')}` : '  Nothing imminent',
        todayReminders.length > 0 ? `  TODAY: ${todayReminders.map((r) => `"${r.title}"`).join(', ')}` : '  No reminders today',
        '',
        `CONTACTS (${contacts.length} recent): ${contacts.map((c) => `${c.name}${c.relationshipType ? ` (${c.relationshipType})` : ''}`).join(', ') || 'None'}`,
    ].join('\n');
    const client = new sdk_1.default({ apiKey: anthropicApiKey.value() });
    const response = await client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 800,
        messages: [
            {
                role: 'user',
                content: `You are ARIA, an AI executive assistant. Generate a concise morning briefing for the user based on their current data. Be warm but efficient — like a great personal secretary. Keep the total under 150 words.

${contextBlock}

Respond with valid JSON only (no markdown):
{
  "summary": "One punchy sentence overview",
  "sections": [
    { "heading": "Section title", "body": "Content" }
  ]
}

Include 2-4 sections covering: urgent items, today's schedule, and a motivating close. Skip sections with nothing relevant. Never make up data not in the context.`,
            },
        ],
    });
    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
    let parsed;
    try {
        parsed = JSON.parse(rawText);
    }
    catch {
        parsed = {
            summary: 'Your briefing is ready.',
            sections: [{ heading: 'Overview', body: rawText.slice(0, 300) }],
        };
    }
    const briefingId = (0, uuid_1.v4)();
    const generatedAt = now.toISOString();
    await db.collection('users').doc(userId).collection('briefings').doc(briefingId).set({
        briefingId,
        summary: parsed.summary,
        sections: parsed.sections,
        generatedAt,
        userId,
    });
    return {
        briefingId,
        summary: parsed.summary,
        sections: parsed.sections,
        generatedAt,
    };
});
//# sourceMappingURL=briefing.js.map