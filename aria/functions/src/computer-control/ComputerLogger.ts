/**
 * Structured logger for the Computer Control module.
 * Mirrors ModelLogger / MarketplaceLogger pattern.
 *
 * NEVER logs sensitive content (passwords, clipboard text, page content,
 * screenshots, tokens, cookies, private keys) by default.
 * Only metadata (capability ID, risk level, user ID, tenant ID, etc.) is logged.
 */
export class ComputerLogger {
  info(event: string, fields: Record<string, unknown> = {}): void {
    console.log(JSON.stringify({ level: 'info', module: 'computer-control', event, ...fields }))
  }

  warn(event: string, fields: Record<string, unknown> = {}): void {
    console.warn(JSON.stringify({ level: 'warn', module: 'computer-control', event, ...fields }))
  }

  error(event: string, fields: Record<string, unknown> = {}): void {
    console.error(JSON.stringify({ level: 'error', module: 'computer-control', event, ...fields }))
  }

  safetyBlock(code: string, capabilityId: string, userId: string, tenantId: string): void {
    console.warn(JSON.stringify({
      level: 'warn',
      module: 'computer-control',
      event: 'safety_guard.triggered',
      code,
      capabilityId,
      userId,
      tenantId,
    }))
  }
}
