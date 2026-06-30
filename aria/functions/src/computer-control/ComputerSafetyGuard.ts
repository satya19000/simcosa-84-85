import type { ComputerCapabilityId } from './ComputerTypes'
import type { ComputerCapabilityRegistry } from './ComputerCapabilityRegistry'

/**
 * ComputerSafetyGuard — hard-block layer that unconditionally rejects
 * dangerous capabilities and operation patterns.
 *
 * HARD INVARIANT: credentialAccess is unconditionally rejected here,
 * regardless of any permission grant, approval state, or policy override.
 * There is NO code path that can allow credentialAccess through.
 *
 * All other hard-blocked patterns (password extraction, cookie theft,
 * stealth browsing, hidden execution, etc.) also throw here — they are
 * named and documented as blocked categories, NEVER as functioning code.
 *
 * This is the FIRST check called by ComputerActionExecutor before any
 * action is attempted.
 */
export class ComputerSafetyGuard {
  constructor(private readonly capabilityRegistry: ComputerCapabilityRegistry) {}

  /**
   * Unconditionally block credentialAccess and all other hard-blocked
   * capabilities. Throws a clear, safe error — never exposes internals.
   *
   * Must be the first call in any execution path.
   */
  assertSafe(capabilityId: ComputerCapabilityId): void {
    // ── credentialAccess: ALWAYS BLOCKED — no bypass path ──────────────────
    // This block can never be removed, overridden, or bypassed by any
    // permission grant, approval state, policy update, or runtime flag.
    if (capabilityId === 'credentialAccess') {
      throw new ComputerSafetyError(
        'CREDENTIAL_ACCESS_BLOCKED',
        'Credential access is unconditionally blocked. ARIA will never read saved passwords, session cookies, tokens, or private keys under any condition.'
      )
    }

    // ── Check always-blocked capability registry entries ────────────────────
    if (this.capabilityRegistry.isAlwaysBlocked(capabilityId)) {
      throw new ComputerSafetyError(
        'CAPABILITY_ALWAYS_BLOCKED',
        `Capability "${capabilityId}" is unconditionally blocked by the ARIA safety policy and cannot be executed under any condition.`
      )
    }
  }

  /**
   * Assert that the provided intent description does not match any
   * hard-blocked operation pattern. Throws ComputerSafetyError if any
   * blocked pattern is detected.
   *
   * These patterns are documented here as NAMED HARD-BLOCKS — they are
   * detected and rejected, never implemented.
   */
  assertIntentSafe(intent: string): void {
    const lower = intent.toLowerCase()

    const hardBlockedPatterns: Array<{ pattern: string; code: string; message: string }> = [
      {
        pattern: 'password',
        code: 'PASSWORD_EXTRACTION_BLOCKED',
        message: 'Extracting saved passwords is unconditionally blocked.',
      },
      {
        pattern: 'cookie',
        code: 'COOKIE_EXTRACTION_BLOCKED',
        message: 'Extracting session cookies or authentication tokens is unconditionally blocked.',
      },
      {
        pattern: 'private key',
        code: 'PRIVATE_KEY_EXTRACTION_BLOCKED',
        message: 'Extracting private keys or cryptographic secrets is unconditionally blocked.',
      },
      {
        pattern: 'bypass login',
        code: 'LOGIN_BYPASS_BLOCKED',
        message: 'Bypassing login or authentication is unconditionally blocked.',
      },
      {
        pattern: 'bypass captcha',
        code: 'CAPTCHA_BYPASS_BLOCKED',
        message: 'CAPTCHA bypass is unconditionally blocked.',
      },
      {
        pattern: 'stealth',
        code: 'STEALTH_BROWSING_BLOCKED',
        message: 'Stealth or hidden browsing operations are unconditionally blocked.',
      },
      {
        pattern: 'hidden execution',
        code: 'HIDDEN_EXECUTION_BLOCKED',
        message: 'Hidden execution paths are unconditionally blocked.',
      },
      {
        pattern: 'monitor without',
        code: 'UNAUTHORIZED_MONITORING_BLOCKED',
        message: 'Unauthorized monitoring is unconditionally blocked.',
      },
      {
        pattern: 'silent screenshot',
        code: 'SILENT_SCREENSHOT_BLOCKED',
        message: 'Silent (non-approved) screenshot capture is unconditionally blocked.',
      },
      {
        pattern: 'silent clipboard',
        code: 'SILENT_CLIPBOARD_BLOCKED',
        message: 'Silent clipboard reading without user awareness is unconditionally blocked.',
      },
      {
        pattern: 'malware',
        code: 'MALWARE_PERSISTENCE_BLOCKED',
        message: 'Any malware-like persistence mechanism is unconditionally blocked.',
      },
      {
        pattern: 'privilege escalat',
        code: 'PRIVILEGE_ESCALATION_BLOCKED',
        message: 'Privilege escalation is unconditionally blocked.',
      },
      {
        pattern: 'keylog',
        code: 'KEYLOGGER_BLOCKED',
        message: 'Keylogging or input capture is unconditionally blocked.',
      },
      {
        pattern: 'auto-pay',
        code: 'AUTO_PAYMENT_BLOCKED',
        message: 'Automatic payment without explicit user approval is unconditionally blocked.',
      },
      {
        pattern: 'auto pay',
        code: 'AUTO_PAYMENT_BLOCKED',
        message: 'Automatic payment without explicit user approval is unconditionally blocked.',
      },
    ]

    for (const { pattern, code, message } of hardBlockedPatterns) {
      if (lower.includes(pattern)) {
        throw new ComputerSafetyError(code, message)
      }
    }
  }

  /**
   * Assert that an action is not being executed without the required
   * approval for medium/high/critical actions. This is a secondary guard —
   * the primary approval gate is ComputerApprovalBridge.
   */
  assertApprovalState(
    capabilityId: ComputerCapabilityId,
    isApproved: boolean
  ): void {
    const descriptor = this.capabilityRegistry.get(capabilityId)
    if (descriptor?.requiresApproval && !isApproved) {
      throw new ComputerSafetyError(
        'APPROVAL_REQUIRED',
        `Capability "${capabilityId}" requires explicit user approval before execution. The action has been queued for approval.`
      )
    }
  }
}

/** Structured safety error — message is always user-safe, never exposes internals. */
export class ComputerSafetyError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message)
    this.name = 'ComputerSafetyError'
  }
}
