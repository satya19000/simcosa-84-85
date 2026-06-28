import { v4 as uuidv4 } from 'uuid'
import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import {
  requireString,
  requireStringMax,
  optionalString,
  requireOneOf,
} from '../Validation'
import { ExecutionError, ValidationError } from '../Errors'

const CONTACT_METHODS = ['phone', 'whatsapp', 'email', 'sms', 'unknown'] as const

export interface UpdateContactArgs {
  contactId: string
  name?: string
  phone?: string | null
  email?: string | null
  role?: string | null
  organization?: string | null
  relationshipType?: string | null
  relationshipNotes?: string | null
  tags?: string[]
  preferredContactMethod?: typeof CONTACT_METHODS[number]
  lastInteractionAt?: string | null
}

export interface UpdateContactData {
  contactId: string
  updatedAt: string
}

export class UpdateContactAction implements BaseAction<UpdateContactArgs, UpdateContactData> {
  readonly toolName = 'updateContact'

  validate(args: UpdateContactArgs): void {
    requireString(args.contactId, 'contactId')
    if (args.name !== undefined) requireStringMax(args.name, 'name', 100)
    if (args.phone !== undefined && args.phone !== null) optionalString(args.phone, 'phone')
    if (args.email !== undefined && args.email !== null) optionalString(args.email, 'email')
    if (args.role !== undefined && args.role !== null) optionalString(args.role, 'role')
    if (args.organization !== undefined && args.organization !== null) optionalString(args.organization, 'organization')
    if (args.relationshipType !== undefined && args.relationshipType !== null) optionalString(args.relationshipType, 'relationshipType')
    if (args.relationshipNotes !== undefined && args.relationshipNotes !== null) optionalString(args.relationshipNotes, 'relationshipNotes')
    if (args.preferredContactMethod !== undefined) requireOneOf(args.preferredContactMethod, 'preferredContactMethod', CONTACT_METHODS)
    if (args.tags !== undefined) {
      if (!Array.isArray(args.tags)) throw new ValidationError('tags', 'must be an array')
    }

    const updateFields: (keyof UpdateContactArgs)[] = ['name', 'phone', 'email', 'role', 'organization', 'relationshipType', 'relationshipNotes', 'tags', 'preferredContactMethod', 'lastInteractionAt']
    const hasUpdate = updateFields.some((f) => args[f] !== undefined)
    if (!hasUpdate) throw new ValidationError('args', 'at least one field to update is required')
  }

  async execute(args: UpdateContactArgs, ctx: ActionContext): Promise<ActionResult<UpdateContactData>> {
    const actionId = uuidv4()
    try {
      const ref = ctx.db.collection('users').doc(ctx.userId).collection('contacts').doc(args.contactId)
      const snap = await ref.get()
      if (!snap.exists) throw new Error(`Contact "${args.contactId}" not found.`)

      const updatedAt = new Date().toISOString()
      const patch: Record<string, unknown> = { updatedAt }

      if (args.name !== undefined) patch.name = args.name.trim()
      if (args.phone !== undefined) patch.phone = args.phone ?? null
      if (args.email !== undefined) patch.email = args.email ?? null
      if (args.role !== undefined) patch.role = args.role ?? null
      if (args.organization !== undefined) patch.organization = args.organization ?? null
      if (args.relationshipType !== undefined) patch.relationshipType = args.relationshipType ?? null
      if (args.relationshipNotes !== undefined) patch.relationshipNotes = args.relationshipNotes ?? null
      if (args.tags !== undefined) patch.tags = args.tags
      if (args.preferredContactMethod !== undefined) patch.preferredContactMethod = args.preferredContactMethod
      if (args.lastInteractionAt !== undefined) patch.lastInteractionAt = args.lastInteractionAt ?? null

      await ref.update(patch)
      return successResult(actionId, 'Contact updated.', { contactId: args.contactId, updatedAt }, elapsedMs(ctx))
    } catch (err) {
      if (err instanceof ValidationError) throw err
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(_args: UpdateContactArgs, _ctx: ActionContext): Promise<void> {}

  audit(args: UpdateContactArgs, ctx: ActionContext, result: ActionResult<UpdateContactData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { contactId: args.contactId, fields: Object.keys(args).filter((k) => k !== 'contactId') },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new UpdateContactAction())
