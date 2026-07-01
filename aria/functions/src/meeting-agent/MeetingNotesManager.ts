/**
 * MeetingNotesManager.ts — manages structured meeting notes and minutes.
 */

import type * as admin from 'firebase-admin'
import type { MeetingSession, MeetingSummary, MeetingActionItem } from './MeetingTypes'

export interface MeetingNotes {
  sessionId: string
  tenantId: string
  title: string
  date: string
  attendees: string[]
  agenda?: string[]
  summary: MeetingSummary | null
  actionItems: MeetingActionItem[]
  rawNotes?: string
  generatedAt: string
}

export class MeetingNotesManager {
  // db is available for future persistence of compiled notes
  constructor(_db: admin.firestore.Firestore) {}

  /**
   * Compile structured meeting notes from session data.
   */
  compileNotes(
    session: MeetingSession,
    summary: MeetingSummary | null,
    actionItems: MeetingActionItem[]
  ): MeetingNotes {
    return {
      sessionId: session.sessionId,
      tenantId: session.tenantId,
      title: session.title,
      date: session.startedAt ?? session.createdAt,
      attendees: session.participants.map((p) => p.name),
      summary,
      actionItems,
      generatedAt: new Date().toISOString(),
    }
  }

  /**
   * Generate markdown-formatted meeting minutes.
   */
  toMarkdown(notes: MeetingNotes): string {
    const lines: string[] = [
      `# Meeting Minutes: ${notes.title}`,
      `**Date:** ${notes.date}`,
      `**Attendees:** ${notes.attendees.join(', ') || 'None recorded'}`,
      '',
    ]

    if (notes.summary) {
      lines.push('## Summary', notes.summary.shortSummary, '')
      if (notes.summary.decisionsMade.length > 0) {
        lines.push('## Decisions Made')
        notes.summary.decisionsMade.forEach((d) => lines.push(`- ${d}`))
        lines.push('')
      }
      if (notes.summary.actionItems.length > 0) {
        lines.push('## Action Items')
        notes.summary.actionItems.forEach((a) => lines.push(`- ${a}`))
        lines.push('')
      }
      if (notes.summary.risks.length > 0) {
        lines.push('## Risks', ...notes.summary.risks.map((r) => `- ${r}`), '')
      }
      if (notes.summary.pendingQuestions.length > 0) {
        lines.push('## Open Questions', ...notes.summary.pendingQuestions.map((q) => `- ${q}`), '')
      }
    }

    if (notes.rawNotes) {
      lines.push('## Raw Notes', notes.rawNotes)
    }

    return lines.join('\n')
  }

  /**
   * Generate plain text meeting minutes.
   */
  toPlainText(notes: MeetingNotes): string {
    return this.toMarkdown(notes)
      .replace(/^#+\s*/gm, '')
      .replace(/\*\*/g, '')
      .replace(/^-\s/gm, '• ')
  }
}
