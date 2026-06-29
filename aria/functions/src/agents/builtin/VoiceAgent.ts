import type { AgentManifest } from '../Agent'
import type { AgentTask } from '../AgentTask'
import type { AgentResult } from '../AgentResult'
import type { AgentContext } from '../AgentContext'
import { BaseAgent } from './BaseAgent'

/**
 * Signals the client to speak a given text via TTS.
 * The actual TTS is handled by the client (BrowserSpeechProvider or similar).
 * This agent just outputs a structured speech signal.
 */
export class VoiceAgent extends BaseAgent {
  readonly manifest: AgentManifest = {
    id: 'voice-agent',
    name: 'Voice Agent',
    description: 'Produces speech signals for client-side TTS playback',
    version: '1.0.0',
    capabilities: ['voice'],
  }

  canHandle(task: AgentTask): boolean {
    return task.capability === 'voice'
  }

  async execute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const startMs = Date.now()
    const text = String(task.input['text'] ?? '')
    const lang = String(task.input['lang'] ?? 'en-US')

    if (!text) {
      return this.makeErrorResult(task, ctx, 'text is required for voice output', startMs)
    }

    // Output a speech signal consumed by the client
    return this.makeResult(
      task,
      ctx,
      { type: 'speech', text, lang },
      `Voice signal: "${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`,
      startMs
    )
  }
}
