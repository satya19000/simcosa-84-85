import type * as admin from 'firebase-admin'

export type MemoryBlockType =
  | 'tasks'
  | 'reminders'
  | 'contacts'
  | 'relationship_notes'
  | 'preferences'
  | 'recent_activity'
  | 'briefing'
  | 'conversation_history'

/** A single chunk of user knowledge passed to Claude via the prompt. */
export interface MemoryBlock {
  type: MemoryBlockType
  title: string
  /** Compact human-readable summary — this is what goes into the prompt. */
  summary: string
  /** Priority 0–100. Higher blocks are included first when trimming for budget. */
  priority: number
  /** Estimated character count of the summary field. */
  sizeChars: number
  /** Raw structured data. Not included in prompt; available for Decision Engine. */
  data: Record<string, unknown>
}

/** Implement this interface to add a new category of memory. */
export interface MemoryProvider {
  readonly name: string
  readonly type: MemoryBlockType
  /**
   * Load memory blocks for this provider.
   * @param message  The raw user message — providers may use it to boost relevance.
   */
  load(
    userId: string,
    db: admin.firestore.Firestore,
    message: string
  ): Promise<MemoryBlock[]>
}
