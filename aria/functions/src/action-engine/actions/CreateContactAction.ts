import { v4 as uuidv4 } from 'uuid'
import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import {
  requireStringMax,
  optionalString,
  requireOneOf,
} from '../Validation'
import { ExecutionError, ValidationError } from '../Errors'

const CONTACT_METHODS = ['phone', 'whatsapp', 'email', 'sms', 'unknown'] as const

export interface CreateContactArgs {
  name: string
  phone?: string
  email?: string
  role?: string
  organization?: string
  relationshipType?: string
  relationshipNotes?: string
  tags?: string[]
  preferredContactMethod?: typeof CONTACT_METHODS[number]
}

export interface CreateContactData {
  contactId: string
  name: string
  createdAt: string
}

export class CreateContactAction implements BaseAction<CreateContactArgs, CreateContactData> {
  readonly toolName = 'createContact'

  validate(args: CreateContactArgs): void {
    requireStringMax(args.name, 'name', 100)
    optionalString(args.phone, 'phone')
    optionalString(args.email, 'email')
    optionalString(args.role, 'role')
    optionalString(args.organization, 'organization')
    optionalString(args.relationshipType, 'relationshipType')
    optionalString(args.relationshipNotes, 'relationshipNotes')
    if (args.preferredContactMethod !== undefined) {
      requireOneOf(args.preferredContactMethod, 'preferredContactMethod', CONTACT_METHODS)
    }
    if (args.tags !== undefined) {
      if (!Array.isArray(args.tags)) throw new ValidationError('tags', 'must be an array if provided')
      for (const tag of args.tags) {
        if (typeof tag !== 'string') throw new ValidationError('tags', 'all tags must be strings')
      }
    }
  }

  async execute(args: CreateContactArgs, ctx: ActionContext): Promise<ActionResult<CreateContactData>> {
    const contactId = uuidv4()
    try {
      const now = new Date().toISOString()
      const doc: Record<string, unknown> = {
        name: args.name.trim(),
        phone: args.phone ?? null,
        email: args.email ?? null,
        role: args.role ?? null,
        organization: args.organization ?? null,
        relationshipType: args.relationshipType ?? null,
        relationshipNotes: args.relationshipNotes ?? null,
        tags: args.tags ?? [],
        preferredContactMethod: args.preferredContactMethod ?? 'unknown',
        lastInteractionAt: null,
        userId: ctx.userId,
        createdAt: now,
        updatedAt: now,
      }

      await ctx.db
        .collection('users').doc(ctx.userId)
        .collection('contacts').doc(contactId)
        .set(doc)

      return successResult(
        contactId,
        `Contact "${args.name.trim()}" saved.`,
        { contactId, name: args.name.trim(), createdAt: now },
        elapsedMs(ctx)
      )
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(_args: CreateContactArgs, _ctx: ActionContext): Promise<void> {}

  audit(args: CreateContactArgs, ctx: ActionContext, result: ActionResult<CreateContactData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { name: args.name, hasPhone: !!args.phone, hasEmail: !!args.email },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new CreateContactAction())
