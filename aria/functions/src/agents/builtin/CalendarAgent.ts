import type { AgentManifest } from '../Agent'
import type { AgentTask } from '../AgentTask'
import type { AgentResult } from '../AgentResult'
import type { AgentContext } from '../AgentContext'
import { BaseAgent } from './BaseAgent'
import { ActionEngine } from '../../action-engine/ActionEngine'

export class CalendarAgent extends BaseAgent {
  readonly manifest: AgentManifest = {
    id: 'calendar-agent',
    name: 'Calendar Agent',
    description: 'Reads and manages calendar events and schedules',
    version: '1.0.0',
    capabilities: ['calendar'],
  }

  canHandle(task: AgentTask): boolean {
    return task.capability === 'calendar'
  }

  async execute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const startMs = Date.now()
    const { action, ...args } = task.input as { action: string; [k: string]: unknown }

    try {
      // Calendar data is stored as reminders with type 'event'
      const result = await ActionEngine.run({
        toolName: action ?? 'listReminders',
        args: { ...(args as Record<string, unknown>), type: 'event' },
        userId: ctx.userId,
        userDisplayName: ctx.userDisplayName,
        db: ctx.db,
      })

      if (!result.success) {
        return this.makeErrorResult(task, ctx, result.error?.detail ?? 'Action failed', startMs)
      }

      return this.makeResult(task, ctx, result.data, result.message, startMs)
    } catch (err) {
      return this.makeErrorResult(task, ctx, err, startMs)
    }
  }
}
