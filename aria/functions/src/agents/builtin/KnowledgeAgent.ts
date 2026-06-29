import Anthropic from '@anthropic-ai/sdk'
import type { AgentManifest } from '../Agent'
import type { AgentTask } from '../AgentTask'
import type { AgentResult } from '../AgentResult'
import type { AgentContext } from '../AgentContext'
import { BaseAgent } from './BaseAgent'

export class KnowledgeAgent extends BaseAgent {
  readonly manifest: AgentManifest = {
    id: 'knowledge-agent',
    name: 'Knowledge Agent',
    description: 'Answers knowledge questions using Claude',
    version: '1.0.0',
    capabilities: ['knowledge'],
  }

  canHandle(task: AgentTask): boolean {
    return task.capability === 'knowledge'
  }

  async execute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const startMs = Date.now()
    const question = String(task.input['question'] ?? task.input['message'] ?? '')
    const memoryContext = task.input['memoryContext'] as string | undefined

    if (!question) {
      return this.makeErrorResult(task, ctx, 'question is required', startMs)
    }

    try {
      const client = new Anthropic({ apiKey: ctx.apiKey })

      const systemPrompt = [
        `You are ARIA, a personal AI secretary for ${ctx.userDisplayName ?? 'the user'}.`,
        memoryContext ? `\nUser context:\n${memoryContext}` : '',
        '\nAnswer concisely and helpfully.',
      ].join('')

      const response = await client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        thinking: { type: 'enabled', budget_tokens: 5000 },
        system: systemPrompt,
        messages: [{ role: 'user', content: question }],
      })

      const textBlock = response.content.find((b) => b.type === 'text')
      const answer = textBlock?.type === 'text' ? textBlock.text : ''

      const tokenUsage = response.usage
        ? { input: response.usage.input_tokens, output: response.usage.output_tokens }
        : undefined

      return this.makeResult(task, ctx, { answer }, answer, startMs, tokenUsage)
    } catch (err) {
      return this.makeErrorResult(task, ctx, err, startMs)
    }
  }
}
