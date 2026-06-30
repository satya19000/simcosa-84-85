/** Structured console logger, mirrors WorkspaceLogger.ts / SecurityLogger.ts. */
export class MarketplaceLogger {
  info(scope: string, message: string, meta?: Record<string, unknown>): void {
    console.log(`[marketplace:${scope}] ${message}`, meta ?? '')
  }

  warn(scope: string, message: string, meta?: Record<string, unknown>): void {
    console.warn(`[marketplace:${scope}] ${message}`, meta ?? '')
  }

  error(scope: string, message: string, meta?: Record<string, unknown>): void {
    console.error(`[marketplace:${scope}] ${message}`, meta ?? '')
  }
}
