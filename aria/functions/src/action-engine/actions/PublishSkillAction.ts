import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireStringMax, requireOneOf } from '../Validation'
import { ExecutionError } from '../Errors'
import { getMarketplaceEngine } from '../../marketplace'
import { MARKETPLACE_CATEGORIES, MARKETPLACE_ITEM_TYPES, type MarketplaceCategory, type MarketplaceItemType } from '../../marketplace/MarketplaceTypes'

export interface PublishSkillArgs {
  name: string
  slug: string
  version: string
  author: string
  description: string
  category: MarketplaceCategory
  itemType: MarketplaceItemType
}

export interface PublishSkillData {
  itemId: string
  name: string
  status: string
}

/** Thin wrapper around MarketplaceEngine.publish — no raw Firestore writes here. */
export class PublishSkillAction implements BaseAction<PublishSkillArgs, PublishSkillData> {
  readonly toolName = 'publishSkill'

  validate(args: PublishSkillArgs): void {
    requireStringMax(args.name, 'name', 200)
    requireStringMax(args.slug, 'slug', 100)
    requireStringMax(args.version, 'version', 20)
    requireStringMax(args.author, 'author', 200)
    requireStringMax(args.description, 'description', 2000)
    requireOneOf(args.category, 'category', MARKETPLACE_CATEGORIES)
    requireOneOf(args.itemType, 'itemType', MARKETPLACE_ITEM_TYPES)
  }

  async execute(args: PublishSkillArgs, ctx: ActionContext): Promise<ActionResult<PublishSkillData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getMarketplaceEngine(ctx.userId, ctx.db, apiKey)
      const item = await engine.publish(ctx.userId, {
        name: args.name,
        slug: args.slug,
        version: args.version,
        author: args.author,
        description: args.description,
        category: args.category,
        itemType: args.itemType,
        publisherId: ctx.userId,
        permissions: [],
      })
      const data: PublishSkillData = { itemId: item.itemId, name: item.manifest.name, status: item.status }
      return successResult(item.itemId, `Skill "${item.manifest.name}" created as draft.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {
    // No safe automatic rollback for a created marketplace draft.
  }

  audit(args: PublishSkillArgs, ctx: ActionContext, result: ActionResult<PublishSkillData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { name: args.name, slug: args.slug, category: args.category },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

// Self-register on module load
import { registry } from '../ActionRegistry'
registry.register(new PublishSkillAction())
