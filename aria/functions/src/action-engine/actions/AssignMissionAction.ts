import type { BaseAction, AuditRecord } from '../BaseAction'
import type { ActionContext } from '../ActionContext'
import { elapsedMs } from '../ActionContext'
import type { ActionResult } from '../ActionResult'
import { successResult } from '../ActionResult'
import { requireString } from '../Validation'
import { ExecutionError, ValidationError } from '../Errors'
import { getOrganizationEngine } from '../../organization'

export interface AssignMissionArgs {
  organizationId: string
  workspaceId: string
  missionId: string
  assignedMemberIds: string[]
}

export interface AssignMissionData {
  sharedMissionId: string
  workspaceId: string
  underlyingMissionId: string
}

/**
 * Wraps OrganizationEngine.assignMissionToWorkspace, which itself only calls
 * the real MissionEngine.getMission to read the mission and never duplicates
 * or executes mission logic — see DelegationManager.ts's documented bridge
 * pattern, mirroring MissionApprovalBridge.
 */
export class AssignMissionAction implements BaseAction<AssignMissionArgs, AssignMissionData> {
  readonly toolName = 'assignMission'

  validate(args: AssignMissionArgs): void {
    requireString(args.organizationId, 'organizationId')
    requireString(args.workspaceId, 'workspaceId')
    requireString(args.missionId, 'missionId')
    if (!Array.isArray(args.assignedMemberIds) || args.assignedMemberIds.length === 0) {
      throw new ValidationError('assignedMemberIds', 'must be a non-empty array')
    }
  }

  async execute(args: AssignMissionArgs, ctx: ActionContext): Promise<ActionResult<AssignMissionData>> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
      const engine = getOrganizationEngine(ctx.userId, ctx.db, apiKey)
      const record = await engine.assignMissionToWorkspace(
        ctx.userId, args.organizationId, args.workspaceId, args.missionId, args.assignedMemberIds
      )
      const data: AssignMissionData = {
        sharedMissionId: record.missionId,
        workspaceId: record.workspaceId,
        underlyingMissionId: record.underlyingMissionId,
      }
      return successResult(record.missionId, `Mission assigned to workspace.`, data, elapsedMs(ctx))
    } catch (err) {
      throw new ExecutionError(this.toolName, err)
    }
  }

  async rollback(): Promise<void> {
    // Best-effort no-op: shared mission pointer is non-destructive metadata; underlying
    // mission state in MissionEngine is never touched by this action, so nothing to undo there.
  }

  audit(args: AssignMissionArgs, ctx: ActionContext, result: ActionResult<AssignMissionData>): AuditRecord {
    return {
      actionId: result.actionId,
      toolName: this.toolName,
      userId: ctx.userId,
      timestamp: ctx.requestTimestamp,
      durationMs: result.executionTimeMs,
      success: result.success,
      argsSummary: { organizationId: args.organizationId, workspaceId: args.workspaceId, missionId: args.missionId, memberCount: args.assignedMemberIds?.length ?? 0 },
      errorCode: result.error?.code ?? null,
      errorDetail: result.error?.detail ?? null,
    }
  }
}

import { registry } from '../ActionRegistry'
registry.register(new AssignMissionAction())
