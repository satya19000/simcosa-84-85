export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  pluginId: string
  level: LogLevel
  message: string
  timestamp: string
  data?: unknown
}

/** Per-plugin logger. Namespaces all output so plugin logs are easily identifiable. */
export class PluginLogger {
  private entries: LogEntry[] = []
  private readonly maxEntries = 500

  constructor(private readonly pluginId: string) {}

  debug(message: string, data?: unknown): void {
    this.write('debug', message, data)
  }

  info(message: string, data?: unknown): void {
    this.write('info', message, data)
  }

  warn(message: string, data?: unknown): void {
    this.write('warn', message, data)
  }

  error(message: string, data?: unknown): void {
    this.write('error', message, data)
  }

  private write(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      pluginId: this.pluginId,
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    }
    this.entries.push(entry)
    if (this.entries.length > this.maxEntries) {
      this.entries.shift()
    }

    const prefix = `[Plugin:${this.pluginId}]`
    switch (level) {
      case 'debug': console.debug(prefix, message, data ?? ''); break
      case 'info':  console.info(prefix, message, data ?? '');  break
      case 'warn':  console.warn(prefix, message, data ?? '');  break
      case 'error': console.error(prefix, message, data ?? ''); break
    }
  }

  getEntries(level?: LogLevel): LogEntry[] {
    return level ? this.entries.filter((e) => e.level === level) : [...this.entries]
  }

  clearEntries(): void {
    this.entries = []
  }
}
