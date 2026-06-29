import type { AgentManifest } from '../Agent'
import type { AgentTask } from '../AgentTask'
import type { AgentResult } from '../AgentResult'
import type { AgentContext } from '../AgentContext'
import { BaseAgent } from './BaseAgent'
import { ActionEngine } from '../../action-engine/ActionEngine'

export class ReminderAgent extends BaseAgent {
  readonly manifest: AgentManifest = {
    id: 'reminder-agent',
    name: 'Reminder Agent',
    description: 'Creates, updates, and reads reminders via ActionEngine',
    version: '1.0.0',
    capabilities: ['reminders'],
  }

  canHandle(task: AgentTask): boolean {
    return task.capability === 'reminders'
  }

  async execute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const startMs = Date.now()
    const { action, ...args } = task.input as { action: string; [k: string]: unknown }

    try {
      const result = await ActionEngine.run({
        toolName: action ?? 'listReminders',
        args: args as Record<string, unknown>,
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
