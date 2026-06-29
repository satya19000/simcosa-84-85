export type AgentLogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface AgentLogEntry {
  agentId: string
  taskId?: string
  graphRunId?: string
  level: AgentLogLevel
  message: string
  timestamp: string
  data?: unknown
}

/** Per-agent structured logger — mirrors PluginLogger and WorkflowLogger pattern. */
export class AgentLogger {
  private entries: AgentLogEntry[] = []
  private readonly maxEntries = 500

  constructor(private readonly agentId: string) {}

  debug(message: string, taskId?: string, data?: unknown): void { this.write('debug', message, taskId, data) }
  info(message: string, taskId?: string, data?: unknown): void  { this.write('info',  message, taskId, data) }
  warn(message: string, taskId?: string, data?: unknown): void  { this.write('warn',  message, taskId, data) }
  error(message: string, taskId?: string, data?: unknown): void { this.write('error', message, taskId, data) }

  private write(level: AgentLogLevel, message: string, taskId?: string, data?: unknown): void {
    const entry: AgentLogEntry = {
      agentId: this.agentId,
      taskId,
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    }
    this.entries.push(entry)
    if (this.entries.length > this.maxEntries) this.entries.shift()

    const tag = `[Agent:${this.agentId}]${taskId ? `[${taskId.slice(0, 8)}]` : ''}`
    switch (level) {
      case 'debug': console.debug(tag, message); break
      case 'info':  console.info(tag, message);  break
      case 'warn':  console.warn(tag, message);  break
      case 'error': console.error(tag, message); break
    }
  }

  getEntries(level?: AgentLogLevel): AgentLogEntry[] {
    return level ? this.entries.filter((e) => e.level === level) : [...this.entries]
  }

  clear(): void { this.entries = [] }
}
