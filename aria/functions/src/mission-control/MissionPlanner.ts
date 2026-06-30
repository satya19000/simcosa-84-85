import type { Mission, MissionTask } from './MissionTypes'
import type { MissionTaskManager } from './MissionTaskManager'

export interface PlanTaskInput {
  title: string
  description?: string
  dependsOnIndexes?: number[] // indexes into the same plan array, resolved to ids after creation
}

/**
 * Deterministic, heuristic mission decomposition — NOT an LLM call. Mirrors
 * the rest of this module's "honest about what's real" stance: this is a
 * straightforward ordered-checklist generator per domain, not an AI planner.
 * A true LLM-driven planner is a reasonable Phase 5.1 addition (see README).
 */
export class MissionPlanner {
  constructor(private readonly tasks: MissionTaskManager) {}

  /** Built-in starter checklist per domain, used when the caller doesn't supply its own plan. */
  defaultPlanFor(mission: Mission): PlanTaskInput[] {
    switch (mission.domain) {
      case 'finance':
        return [
          { title: 'Define budget / financial target' },
          { title: 'Identify funding source or cost center', dependsOnIndexes: [0] },
          { title: 'Review with approver if above auto-execute threshold', dependsOnIndexes: [1] },
          { title: 'Execute and track spend against budget', dependsOnIndexes: [2] },
        ]
      case 'health':
        return [
          { title: 'Clarify health objective / decision needed' },
          { title: 'Gather relevant patient/medical context', dependsOnIndexes: [0] },
          { title: 'Route through clinical decision support if applicable', dependsOnIndexes: [1] },
          { title: 'Schedule and confirm follow-up', dependsOnIndexes: [2] },
        ]
      case 'delegation':
        return [
          { title: 'Draft the action(s) to delegate or approve' },
          { title: 'Submit for approval via ApprovalEngine', dependsOnIndexes: [0] },
          { title: 'Track decision and execute if approved', dependsOnIndexes: [1] },
        ]
      case 'communication':
        return [
          { title: 'Identify recipients and message intent' },
          { title: 'Draft communication', dependsOnIndexes: [0] },
          { title: 'Send (gated by approval if external/risky)', dependsOnIndexes: [1] },
        ]
      default:
        return [
          { title: 'Clarify mission objective' },
          { title: 'Break into concrete next actions', dependsOnIndexes: [0] },
          { title: 'Execute and review outcome', dependsOnIndexes: [1] },
        ]
    }
  }

  /** Persist a plan (default or caller-supplied) as ordered MissionTasks with resolved dependsOn ids. */
  async applyPlan(userId: string, mission: Mission, plan?: PlanTaskInput[]): Promise<MissionTask[]> {
    const steps = plan && plan.length > 0 ? plan : this.defaultPlanFor(mission)
    const created: MissionTask[] = []
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const dependsOn = (step.dependsOnIndexes ?? [])
        .map((idx) => created[idx]?.id)
        .filter((id): id is string => !!id)
      const task = await this.tasks.createTask(userId, {
        missionId: mission.id,
        title: step.title,
        description: step.description,
        order: i,
        dependsOn,
      })
      created.push(task)
    }
    return created
  }
}
