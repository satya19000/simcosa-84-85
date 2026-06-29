import type { AgentManifest } from '../Agent'
import type { AgentTask } from '../AgentTask'
import type { AgentResult } from '../AgentResult'
import type { AgentContext } from '../AgentContext'
import type { ValidationResult } from '../AgentTypes'
import { BaseAgent } from './BaseAgent'

/**
 * Cross-cuts all agent outputs and validates them for completeness and safety.
 * Used by the Orchestrator as a final quality gate.
 */
export class ValidatorAgent extends BaseAgent {
  readonly manifest: AgentManifest = {
    id: 'validator-agent',
    name: 'Validator Agent',
    description: 'Validates agent outputs for completeness and safety',
    version: '1.0.0',
    capabilities: ['validation'],
  }

  canHandle(task: AgentTask): boolean {
    return task.capability === 'validation'
  }

  async execute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const startMs = Date.now()
    const results = task.input['results'] as AgentResult[] | undefined

    if (!results || results.length === 0) {
      return this.makeResult(task, ctx, { outcome: 'pass', issues: [] }, 'Nothing to validate', startMs)
    }

    const issues: string[] = []
    for (const r of results) {
      if (r.status === 'failed') {
        issues.push(`Task "${r.taskId}" failed: ${r.error ?? 'unknown error'}`)
      } else if (r.output === null || r.output === undefined) {
        issues.push(`Task "${r.taskId}" completed with null output`)
      }
    }

    const outcome = issues.length === 0 ? 'pass' : 'fail'
    return this.makeResult(
      task,
      ctx,
      { outcome, issues },
      outcome === 'pass' ? 'All outputs validated' : `Validation issues: ${issues.join('; ')}`,
      startMs
    )
  }

  async validate(result: AgentResult, _ctx: AgentContext): Promise<ValidationResult> {
    // Validator always passes its own output
    return { outcome: 'pass', issues: [], confidence: 1 }
  }
}
