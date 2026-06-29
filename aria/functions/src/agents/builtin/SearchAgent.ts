import type { AgentManifest } from '../Agent'
import type { AgentTask } from '../AgentTask'
import type { AgentResult } from '../AgentResult'
import type { AgentContext } from '../AgentContext'
import { BaseAgent } from './BaseAgent'
import { ActionEngine } from '../../action-engine/ActionEngine'

export class SearchAgent extends BaseAgent {
  readonly manifest: AgentManifest = {
    id: 'search-agent',
    name: 'Search Agent',
    description: 'Searches across tasks, contacts, and reminders',
    version: '1.0.0',
    capabilities: ['search'],
  }

  canHandle(task: AgentTask): boolean {
    return task.capability === 'search'
  }

  async execute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const startMs = Date.now()
    const query = String(task.input['query'] ?? '')
    const scopes = (task.input['scopes'] as string[] | undefined) ?? ['tasks', 'contacts', 'reminders']

    if (!query) {
      return this.makeErrorResult(task, ctx, 'query is required', startMs)
    }

    try {
      const searches = scopes.map(async (scope) => {
        const toolName = scope === 'contacts' ? 'searchContacts' : scope === 'tasks' ? 'listTasks' : 'listReminders'
        const result = await ActionEngine.run({
          toolName,
          args: { query, search: query },
          userId: ctx.userId,
          userDisplayName: ctx.userDisplayName,
          db: ctx.db,
        })
        return { scope, data: result.data, success: result.success }
      })

      const results = await Promise.all(searches)
      const output = Object.fromEntries(results.map((r) => [r.scope, r.data]))
      const totalItems = results.reduce((sum, r) => {
        const d = r.data
        return sum + (Array.isArray(d) ? d.length : 0)
      }, 0)

      return this.makeResult(task, ctx, output, `Found ${totalItems} result(s) for "${query}"`, startMs)
    } catch (err) {
      return this.makeErrorResult(task, ctx, err, startMs)
    }
  }
}
