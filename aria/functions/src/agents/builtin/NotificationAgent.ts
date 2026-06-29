import type { AgentManifest } from '../Agent'
import type { AgentTask } from '../AgentTask'
import type { AgentResult } from '../AgentResult'
import type { AgentContext } from '../AgentContext'
import { BaseAgent } from './BaseAgent'
import { ActionEngine } from '../../action-engine/ActionEngine'

export class NotificationAgent extends BaseAgent {
  readonly manifest: AgentManifest = {
    id: 'notification-agent',
    name: 'Notification Agent',
    description: 'Sends push notifications and in-app alerts',
    version: '1.0.0',
    capabilities: ['notification'],
  }

  canHandle(task: AgentTask): boolean {
    return task.capability === 'notification'
  }

  async execute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const startMs = Date.now()
    const { title, body, data } = task.input as {
      title?: string
      body?: string
      data?: Record<string, string>
    }

    try {
      const result = await ActionEngine.run({
        toolName: 'sendNotification',
        args: { title: title ?? 'ARIA', body: body ?? '', data },
        userId: ctx.userId,
        userDisplayName: ctx.userDisplayName,
        db: ctx.db,
      })

      if (!result.success) {
        return this.makeErrorResult(task, ctx, result.error?.detail ?? 'Notification failed', startMs)
      }

      return this.makeResult(task, ctx, result.data, result.message, startMs)
    } catch (err) {
      return this.makeErrorResult(task, ctx, err, startMs)
    }
  }
}
