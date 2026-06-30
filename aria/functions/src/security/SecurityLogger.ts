/** Structured console logger, mirrors WorkspaceLogger.ts / ApprovalLogger.ts. */
export class SecurityLogger {
  info(tenantId: string, event: string, data?: Record<string, unknown>): void {
    console.log(`[security:${tenantId}] ${event}`, data ?? {})
  }

  warn(tenantId: string, event: string, data?: Record<string, unknown>): void {
    console.warn(`[security:${tenantId}] ${event}`, data ?? {})
  }

  error(tenantId: string, event: string, data?: Record<string, unknown>): void {
    console.error(`[security:${tenantId}] ${event}`, data ?? {})
  }
}
