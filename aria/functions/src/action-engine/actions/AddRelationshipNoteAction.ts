import { v4 as uuidv4 } from 'uuid'
import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireString, requireStringMax, optionalString, requireOneOf } from '../Validation'
import { ExecutionError, ValidationError } from '../Errors'

const SOURCES = ['chat', 'manual', 'call', 'meeting'] as const
const IMPORTANCES = ['low', 'normal', 'high'] as const

export interface AddRelationshipNoteArgs {
  contactId?: string
  contactName?: string
  note: string
  importance?: typeof IMPORTANCES[number]
  source?: typeof SOURCES[number]
}

export interface AddRelationshipNoteData {
  memoryId: string
  contactId: string
  createdAt: string
}

export class AddRelationshipNoteAction implements BaseAction<AddRelationshipNoteArgs, AddRelationshipNoteData> {
  readonly toolName = 'addRelationshipNote'

  validate(args: AddRelationshipNoteArgs): void {
    if (!args.contactId && !args.contactName) {
      throw new ValidationError('contactId/contactName', 'either contactId or contactName is required')
    }
    if (args.contactId) requireString(args.contactId, 'contactId')
    if (args.contactName) optionalString(args.contactName, 'contactName')
    requireStringMax(args.note, 'note', 2000)
    if (args.importance !== undefined) requireOneOf(args.importance, 'importance', IMPORTANCES)
    if (args.source !== undefined) requireOneOf(args.source, 'source', SOURCES)
  }

  async execute(args: AddRelationshipNoteArgs, ctx: ActionContext): Promise<ActionResult<AddRelationshipNoteData>> {
    const memoryId = uuidv4()
    try {
      let contactId = args.contactId

      // Resolve by name if only name provided
      if (!contactId && args.contactName) {
        const snap = await ctx.db
          .collection('users').doc(ctx.userId)
          .collection('contacts')
          .where('name', '==', args.contactName.trim())
          .limit(1)
          .get()

        if (snap.empty) {
          throw new Error(`No contact found with name "${args.contactName}". Please create the contact first.`)
        }
        contactId = snap.docs[0].id
      }

      // Confirm contact exists
      const contactRef = ctx.db.collection('users').doc(ctx.userId).collection('contacts').doc(contactId!)
      const contactSnap = await contactRef.get()
      if (!contactSnap.exists) {
        throw new Error(`Contact "${contactId}" not found.`)
      }
      const contactName = (contactSnap.data() as { name: string }).name

      const now = new Date().toISOString()
      const memoryDoc = {
        contactId: contactId!,
        note: args.note.trim(),
        source: args.source ?? 'chat',
        importance: args.importance ?? 'normal',
        userId: ctx.userId,
        createdAt: now,
      }

      await ctx.db
        .collection('users').doc(ctx.userId)
        .collection('relationshipMemory').doc(memoryId)
        .set(memoryDoc)

      // Also append note to contact's relationshipNotes field
      const existingNotes = (contactSnap.data() as { relationshipNotes?: string }).relationshipNotes ?? ''
      const newNotes = existingNotes
        ? `${existingNotes}\n[${now.slice(0, 10)}] ${args.note.trim()}`
        : `[${now.slice(0, 10)}] ${args.note.trim()}`

      await contactRef.update({ relationshipNotes: newNotes, updatedAt: now })

      return successResult(
        memoryId,
        `Note added to ${contactName}.`,
        { memoryId, contactId: contactId!, createdAt: now },
        elapsedMs(ctx)
      )
    } catch (err) {
      if (err instanceof ValidationError) throw err
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(_args: AddRelationshipNoteArgs, _ctx: ActionContext): Promise<void> {}

  audit(args: AddRelationshipNoteArgs, ctx: ActionContext, result: ActionResult<AddRelationshipNoteData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: {
        contactId: args.contactId ?? null,
        contactName: args.contactName ?? null,
        importance: args.importance ?? 'normal',
      },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new AddRelationshipNoteAction())
