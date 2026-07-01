/**
 * MeetingActionExtractor.ts — extracts action item suggestions from transcripts.
 *
 * CRITICAL SAFETY INVARIANT:
 * - This engine returns SUGGESTIONS ONLY.
 * - It NEVER auto-creates tasks, reminders, or any other entities.
 * - All suggestions require explicit user approval before any action is taken.
 * - Approval flows through MeetingApprovalBridge → ApprovalEngine.
 */

import type * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { AIGateway } from '../ai-gateway/AIGateway'
import type { MeetingActionItem, ActionItemType } from './MeetingTypes'
import { MeetingLogger } from './MeetingLogger'

const ACTION_ITEMS_COL = (tenantId: string) => `tenants/${tenantId}/meetingActionItems`

export class MeetingActionExtractor {
  private readonly logger = new MeetingLogger()

  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly aiGateway: AIGateway
  ) {}

  /**
   * Extract action item SUGGESTIONS from a transcript via AI Gateway.
   *
   * INVARIANT: Returns suggestions with approvalStatus='suggestion'.
   * No task, reminder, or external action is created here.
   * User must explicitly approve before any action is taken.
   */
  async extractActionItems(input: {
    sessionId: string
    tenantId: string
    userId: string
    transcriptText: string
  }): Promise<MeetingActionItem[]> {
    const prompt = this.buildExtractionPrompt(input.transcriptText)

    const response = await this.aiGateway.complete({
      tenantId: input.tenantId,
      userId: input.userId,
      taskType: 'extraction',
      systemPrompt: 'You are an expert at extracting action items from meeting transcripts. Return only structured JSON.',
      userMessage: prompt,
      history: [],
    })

    const suggestions = this.parseActionItems(response.text ?? '', input)
    this.logger.log('action_items_extracted', input.sessionId, `count=${suggestions.length}`)
    return suggestions
  }

  /**
   * Persist a suggestion to Firestore (still in 'suggestion' state).
   */
  async saveSuggestions(suggestions: MeetingActionItem[]): Promise<void> {
    if (suggestions.length === 0) return
    const batch = this.db.batch()
    for (const item of suggestions) {
      const ref = this.db
        .collection(ACTION_ITEMS_COL(item.tenantId))
        .doc(item.actionItemId)
      batch.set(ref, item)
    }
    await batch.commit()
  }

  /**
   * Update an action item's approval status (e.g., after user approves).
   */
  async updateApprovalStatus(
    tenantId: string,
    actionItemId: string,
    status: MeetingActionItem['approvalStatus'],
    approvalRequestId?: string
  ): Promise<void> {
    const now = new Date().toISOString()
    await this.db
      .collection(ACTION_ITEMS_COL(tenantId))
      .doc(actionItemId)
      .update({ approvalStatus: status, approvalRequestId, updatedAt: now })
  }

  async listSuggestions(tenantId: string, sessionId: string): Promise<MeetingActionItem[]> {
    const snap = await this.db
      .collection(ACTION_ITEMS_COL(tenantId))
      .where('sessionId', '==', sessionId)
      .orderBy('createdAt', 'asc')
      .get()
    return snap.docs.map((d) => d.data() as MeetingActionItem)
  }

  private buildExtractionPrompt(transcript: string): string {
    return `Analyze this meeting transcript and extract action items.

Transcript:
${transcript}

Return a JSON array with items having this shape:
[{
  "type": "task|reminder|followUp|callToMake|emailToSend|messageToSend|documentToPrepare|approvalNeeded|deadline",
  "description": "clear description of the action",
  "assignee": "person name if mentioned",
  "dueDate": "ISO date if mentioned",
  "priority": "low|medium|high",
  "extractedFromText": "the exact quote this was extracted from"
}]

Return only the JSON array, no other text.`
  }

  private parseActionItems(
    text: string,
    context: { sessionId: string; tenantId: string; userId: string }
  ): MeetingActionItem[] {
    const now = new Date().toISOString()
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) return []
      const items = JSON.parse(jsonMatch[0]) as Array<Record<string, unknown>>
      return items.map((item): MeetingActionItem => ({
        actionItemId: uuidv4(),
        sessionId: context.sessionId,
        tenantId: context.tenantId,
        userId: context.userId,
        type: (item.type as ActionItemType) ?? 'task',
        description: String(item.description ?? ''),
        assignee: item.assignee ? String(item.assignee) : undefined,
        dueDate: item.dueDate ? String(item.dueDate) : undefined,
        priority: (item.priority as MeetingActionItem['priority']) ?? 'medium',
        approvalStatus: 'suggestion',   // ALWAYS starts as suggestion
        extractedFromText: item.extractedFromText ? String(item.extractedFromText) : undefined,
        createdAt: now,
        updatedAt: now,
      }))
    } catch {
      return []
    }
  }
}
