export type WorkflowLogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface WorkflowLogEntry {
  executionId: string
  level: WorkflowLogLevel
  stepId?: string
  message: string
  timestamp: string
  data?: unknown
}

/** Per-execution structured logger — mirrors PluginLogger pattern. */
export class WorkflowLogger {
  private entries: WorkflowLogEntry[] = []
  private readonly maxEntries = 1000

  constructor(
    private readonly executionId: string,
    private readonly workflowId: string
  ) {}

  debug(message: string, stepId?: string, data?: unknown): void {
    this.write('debug', message, stepId, data)
  }

  info(message: string, stepId?: string, data?: unknown): void {
    this.write('info', message, stepId, data)
  }

  warn(message: string, stepId?: string, data?: unknown): void {
    this.write('warn', message, stepId, data)
  }

  error(message: string, stepId?: string, data?: unknown): void {
    this.write('error', message, stepId, data)
  }

  private write(level: WorkflowLogLevel, message: string, stepId?: string, data?: unknown): void {
    const entry: WorkflowLogEntry = {
      executionId: this.executionId,
      level,
      stepId,
      message,
      timestamp: new Date().toISOString(),
      data,
    }
    this.entries.push(entry)
    if (this.entries.length > this.maxEntries) this.entries.shift()

    const prefix = `[Workflow:${this.workflowId}/${this.executionId.slice(0, 8)}]${stepId ? `[${stepId}]` : ''}`
    switch (level) {
      case 'debug': console.debug(prefix, message); break
      case 'info':  console.info(prefix, message);  break
      case 'warn':  console.warn(prefix, message);  break
      case 'error': console.error(prefix, message); break
    }
  }

  getEntries(level?: WorkflowLogLevel): WorkflowLogEntry[] {
    return level ? this.entries.filter((e) => e.level === level) : [...this.entries]
  }

  clear(): void {
    this.entries = []
  }
}
