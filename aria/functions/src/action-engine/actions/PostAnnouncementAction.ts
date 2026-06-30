import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireString, requireStringMax, optionalString } from '../Validation'
import { ExecutionError } from '../Errors'
import { getOrganizationEngine } from '../../organization'

export interface PostAnnouncementArgs {
  organizationId: string
  title: string
  body: string
  workspaceId?: string
}

export interface PostAnnouncementData {
  activityId: string
  title: string
}

export class PostAnnouncementAction implements BaseAction<PostAnnouncementArgs, PostAnnouncementData> {
  readonly toolName = 'postAnnouncement'

  validate(args: PostAnnouncementArgs): void {
    requireString(args.organizationId, 'organizationId')
    requireStringMax(args.title, 'title', 200)
    requireString(args.body, 'body')
    optionalString(args.workspaceId, 'workspaceId')
  }

  async execute(args: PostAnnouncementArgs, ctx: ActionContext): Promise<ActionResult<PostAnnouncementData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getOrganizationEngine(ctx.userId, ctx.db, apiKey)
      const record = await engine.postAnnouncement(ctx.userId, args.organizationId, {
        title: args.title,
        body: args.body,
        workspaceId: args.workspaceId ?? null,
      })
      const data: PostAnnouncementData = { activityId: record.activityId, title: args.title }
      return successResult(record.activityId, `Announcement "${args.title}" posted.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {
    // Best-effort no-op: announcements are append-only activity feed entries, treated as
    // immutable history, mirroring ApprovalHistory's append-only philosophy.
  }

  audit(args: PostAnnouncementArgs, ctx: ActionContext, result: ActionResult<PostAnnouncementData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { organizationId: args.organizationId, title: args.title, workspaceId: args.workspaceId ?? null },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new PostAnnouncementAction())
