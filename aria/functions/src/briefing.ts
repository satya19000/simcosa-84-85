import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import Anthropic from '@anthropic-ai/sdk'
import { v4 as uuidv4 } from 'uuid'

const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY')

interface GenerateBriefingRequest {
  timezone?: string
}

interface BriefingSection {
  heading: string
  body: string
}

interface GenerateBriefingResponse {
  briefingId: string
  summary: string
  sections: BriefingSection[]
  generatedAt: string
}

export const generateDailyBriefing = onCall(
  { secrets: [anthropicApiKey], timeoutSeconds: 60, memory: '512MiB' },
  async (request: CallableRequest<GenerateBriefingRequest>): Promise<GenerateBriefingResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.')
    }

    const userId = request.auth.uid
    const timezone = request.data.timezone ?? 'UTC'
    const db = admin.firestore()
    const now = new Date()

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
    ])

    const tasks = tasksSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<Record<string, unknown>>
    const reminders = remindersSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<Record<string, unknown>>
    const contacts = contactsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<Record<string, unknown>>

    const nowIso = now.toISOString()
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)
    const endOfDayIso = endOfDay.toISOString()

    const overdueTasks = tasks.filter((t) => t.dueAt && (t.dueAt as string) < nowIso)
    const todayTasks = tasks.filter((t) => t.dueAt && (t.dueAt as string) >= nowIso && (t.dueAt as string) <= endOfDayIso)
    const highPriority = tasks.filter((t) => t.priority === 'high' || t.priority === 'critical')
    const todayReminders = reminders.filter((r) => (r.scheduledAt as string) <= endOfDayIso)
    const imminent = reminders.filter((r) => (r.scheduledAt as string) >= nowIso && (r.scheduledAt as string) <= twoHoursFromNow)

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
    ].join('\n')

    const client = new Anthropic({ apiKey: anthropicApiKey.value() })

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
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    let parsed: { summary: string; sections: BriefingSection[] }

    try {
      parsed = JSON.parse(rawText)
    } catch {
      parsed = {
        summary: 'Your briefing is ready.',
        sections: [{ heading: 'Overview', body: rawText.slice(0, 300) }],
      }
    }

    const briefingId = uuidv4()
    const generatedAt = now.toISOString()

    await db.collection('users').doc(userId).collection('briefings').doc(briefingId).set({
      briefingId,
      summary: parsed.summary,
      sections: parsed.sections,
      generatedAt,
      userId,
    })

    return {
      briefingId,
      summary: parsed.summary,
      sections: parsed.sections,
      generatedAt,
    }
  }
)
