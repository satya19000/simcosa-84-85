/**
 * Structured console logger for the AI Gateway. Mirrors MarketplaceLogger /
 * SecurityLogger's shape. NEVER logs full prompt or response text unless
 * `debugMode` is explicitly true on the call — only metadata (provider,
 * model, latency, tokens, cost, error class) is logged by default.
 */
export class ModelLogger {
  info(event: string, fields: Record<string, unknown> = {}): void {
    console.log(JSON.stringify({ level: 'info', module: 'ai-gateway', event, ...fields }))
  }

  warn(event: string, fields: Record<string, unknown> = {}): void {
    console.warn(JSON.stringify({ level: 'warn', module: 'ai-gateway', event, ...fields }))
  }

  error(event: string, fields: Record<string, unknown> = {}): void {
    console.error(JSON.stringify({ level: 'error', module: 'ai-gateway', event, ...fields }))
  }

  /** Only call with prompt/response text when `debugMode` is true at the call site. */
  debug(event: string, fields: Record<string, unknown> = {}): void {
    console.log(JSON.stringify({ level: 'debug', module: 'ai-gateway', event, ...fields }))
  }
}
