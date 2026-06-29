import Anthropic from '@anthropic-ai/sdk'
import type { AgentManifest } from '../Agent'
import type { AgentTask } from '../AgentTask'
import type { AgentResult } from '../AgentResult'
import type { AgentContext } from '../AgentContext'
import { BaseAgent } from './BaseAgent'

export class BriefingAgent extends BaseAgent {
  readonly manifest: AgentManifest = {
    id: 'briefing-agent',
    name: 'Briefing Agent',
    description: 'Generates daily briefings using Claude',
    version: '1.0.0',
    capabilities: ['briefing'],
  }

  canHandle(task: AgentTask): boolean {
    return task.capability === 'briefing'
  }

  async execute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const startMs = Date.now()
    const context = task.input['context'] as Record<string, unknown> | undefined
    const userName = ctx.userDisplayName ?? 'there'

    try {
      const client = new Anthropic({ apiKey: ctx.apiKey })

      const contextText = context
        ? Object.entries(context)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join('\n')
        : 'No context provided.'

      const response = await client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        thinking: { type: 'enabled', budget_tokens: 5000 },
        system: `You are ARIA, a personal AI secretary. Generate a concise, friendly morning briefing for ${userName}. Be warm and professional. Keep it under 200 words.`,
        messages: [{ role: 'user', content: `Here is today's context:\n${contextText}\n\nGenerate a morning briefing.` }],
      })

      const textBlock = response.content.find((b) => b.type === 'text')
      const briefing = textBlock?.type === 'text' ? textBlock.text : ''

      const tokenUsage = response.usage
        ? { input: response.usage.input_tokens, output: response.usage.output_tokens }
        : undefined

      return this.makeResult(task, ctx, { briefing }, briefing, startMs, tokenUsage)
    } catch (err) {
      return this.makeErrorResult(task, ctx, err, startMs)
    }
  }
}
