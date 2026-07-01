/**
 * MeetingLogger.ts — structured logging for the Meeting Agent.
 *
 * PRIVACY INVARIANT: Never logs raw transcript content by default.
 * Only logs event type, session metadata, and non-sensitive details.
 */

export class MeetingLogger {
  private readonly prefix = '[MeetingAgent]'

  log(event: string, sessionId: string, detail?: string): void {
    // Non-sensitive logging only
    console.log(`${this.prefix} ${event} | session=${sessionId}${detail ? ` | ${detail}` : ''}`)
  }

  warn(event: string, sessionId: string, detail?: string): void {
    console.warn(`${this.prefix} WARN ${event} | session=${sessionId}${detail ? ` | ${detail}` : ''}`)
  }

  error(event: string, sessionId: string, err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`${this.prefix} ERROR ${event} | session=${sessionId} | ${msg}`)
  }

  // Explicitly NO method for logging transcript content — by design.
}
