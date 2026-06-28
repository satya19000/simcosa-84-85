import { v4 as uuidv4 } from 'uuid'
import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireStringMax } from '../Validation'
import { ExecutionError } from '../Errors'

export interface SearchContactsArgs {
  query: string
}

export interface ContactSummary {
  contactId: string
  name: string
  role: string | null
  organization: string | null
  phone: string | null
  email: string | null
  relationshipType: string | null
  relationshipNotes: string | null
  preferredContactMethod: string | null
  tags: string[]
}

export interface SearchContactsData {
  results: ContactSummary[]
  total: number
}

export class SearchContactsAction implements BaseAction<SearchContactsArgs, SearchContactsData> {
  readonly toolName = 'searchContacts'

  validate(args: SearchContactsArgs): void {
    requireStringMax(args.query, 'query', 200)
  }

  async execute(args: SearchContactsArgs, ctx: ActionContext): Promise<ActionResult<SearchContactsData>> {
    const actionId = uuidv4()
    try {
      const q = args.query.trim().toLowerCase()

      const snap = await ctx.db
        .collection('users').doc(ctx.userId)
        .collection('contacts')
        .orderBy('name')
        .get()

      const results: ContactSummary[] = []
      for (const doc of snap.docs) {
        const d = doc.data() as Record<string, unknown>
        const name = (d.name as string ?? '').toLowerCase()
        const role = (d.role as string ?? '').toLowerCase()
        const org = (d.organization as string ?? '').toLowerCase()
        const relType = (d.relationshipType as string ?? '').toLowerCase()
        const notes = (d.relationshipNotes as string ?? '').toLowerCase()
        const tags = ((d.tags as string[]) ?? []).join(' ').toLowerCase()

        if (
          name.includes(q) || role.includes(q) || org.includes(q) ||
          relType.includes(q) || notes.includes(q) || tags.includes(q)
        ) {
          results.push({
            contactId: doc.id,
            name: d.name as string,
            role: (d.role as string | null) ?? null,
            organization: (d.organization as string | null) ?? null,
            phone: (d.phone as string | null) ?? null,
            email: (d.email as string | null) ?? null,
            relationshipType: (d.relationshipType as string | null) ?? null,
            relationshipNotes: (d.relationshipNotes as string | null) ?? null,
            preferredContactMethod: (d.preferredContactMethod as string | null) ?? null,
            tags: (d.tags as string[]) ?? [],
          })
        }
      }

      const label = results.length === 0
        ? `No contacts found matching "${args.query}".`
        : `Found ${results.length} contact${results.length > 1 ? 's' : ''} matching "${args.query}".`

      return successResult(actionId, label, { results, total: results.length }, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(_args: SearchContactsArgs, _ctx: ActionContext): Promise<void> {}

  audit(args: SearchContactsArgs, ctx: ActionContext, result: ActionResult<SearchContactsData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { query: args.query, hits: (result.data as SearchContactsData | undefined)?.total ?? 0 },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new SearchContactsAction())
