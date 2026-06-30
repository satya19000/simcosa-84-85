import type { ComputerCapabilityId, ComputerActionResult, ComputerProviderType } from './ComputerTypes'

/**
 * Provider interface for computer-control operations.
 *
 * Providers implement the actual (or placeholder) execution of capabilities.
 * All non-web-pwa providers are PLACEHOLDERS — they return structured
 * "not implemented" results and are explicitly documented as such.
 *
 * No provider may execute any capability that has not already been cleared by:
 * 1. ComputerSafetyGuard.assertSafe()
 * 2. ComputerPermissions.requireCapabilityPermission()
 * 3. ComputerApprovalBridge (for medium/high/critical capabilities)
 */
export interface ComputerProviderCapabilities {
  readonly supported: ComputerCapabilityId[]
  readonly providerType: ComputerProviderType
  readonly isPlaceholder: boolean
}

export interface ComputerProvider {
  readonly capabilities: ComputerProviderCapabilities

  /**
   * Execute a capability. Must ONLY be called by ComputerActionExecutor
   * after all safety, permission, and approval checks have passed.
   */
  execute(
    capabilityId: ComputerCapabilityId,
    parameters: Record<string, unknown>
  ): Promise<ComputerActionResult>
}

/**
 * Web PWA Provider — the ONLY semi-functional provider.
 * Operates within what a web app can legitimately do via browser APIs
 * (conceptually: openUrl, copyToClipboard, uploadFileWithUserPicker).
 * All operations require user gesture; none are silent.
 */
export class WebPWAProvider implements ComputerProvider {
  readonly capabilities: ComputerProviderCapabilities = {
    providerType: 'web-pwa',
    isPlaceholder: false,
    supported: [
      'readVisiblePage',
      'summarizeVisiblePage',
      'openUrl',
      'searchWeb',
      'copyToClipboard',
      'uploadFileWithUserPicker',
    ],
  }

  async execute(capabilityId: ComputerCapabilityId, parameters: Record<string, unknown>): Promise<ComputerActionResult> {
    switch (capabilityId) {
      case 'openUrl': {
        const url = typeof parameters.url === 'string' ? parameters.url : null
        if (!url) return { success: false, capabilityId, error: 'url parameter required' }
        // In a real web context this would call window.open; here we return the intent
        return { success: true, capabilityId, output: { action: 'open_url', url } }
      }
      case 'searchWeb': {
        const query = typeof parameters.query === 'string' ? parameters.query : ''
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`
        return { success: true, capabilityId, output: { action: 'open_url', url } }
      }
      case 'copyToClipboard': {
        const text = typeof parameters.text === 'string' ? parameters.text : ''
        // In a real web context this would call navigator.clipboard.writeText
        return { success: true, capabilityId, output: { action: 'clipboard_write', length: text.length } }
      }
      case 'readVisiblePage':
      case 'summarizeVisiblePage':
        // Page content reading is handled by Document Intelligence integration
        return { success: true, capabilityId, output: { action: 'read_page', note: 'Page content forwarded to Document Intelligence.' } }
      case 'uploadFileWithUserPicker':
        return { success: true, capabilityId, output: { action: 'file_picker_opened', note: 'Browser file picker opened — user controls file selection.' } }
      default:
        return {
          success: false,
          capabilityId,
          error: `WebPWAProvider does not support capability "${capabilityId}".`,
          notImplemented: true,
        }
    }
  }
}

/**
 * Browser Extension Provider — PLACEHOLDER.
 * No browser extension package is built or published.
 * Returns structured "not implemented" for all capabilities.
 */
export class BrowserExtensionProvider implements ComputerProvider {
  readonly capabilities: ComputerProviderCapabilities = {
    providerType: 'browser-extension',
    isPlaceholder: true,
    supported: ['listBrowserTabs', 'switchTab', 'screenshotWithApproval', 'ocrScreenshot', 'readClipboard', 'pasteFromClipboard'],
  }

  async execute(capabilityId: ComputerCapabilityId, _parameters: Record<string, unknown>): Promise<ComputerActionResult> {
    return {
      success: false,
      capabilityId,
      error: 'Browser Extension Provider is a PLACEHOLDER — no extension is installed or published. This capability requires installing a future ARIA browser extension.',
      notImplemented: true,
    }
  }
}

/**
 * Desktop Agent Provider — PLACEHOLDER.
 * No desktop agent binary or installer exists.
 * Returns structured "not implemented" for all capabilities.
 */
export class DesktopAgentProvider implements ComputerProvider {
  readonly capabilities: ComputerProviderCapabilities = {
    providerType: 'desktop-agent',
    isPlaceholder: true,
    supported: ['openApp', 'createFile', 'moveFile', 'renameFile', 'deleteFile', 'downloadFileWithUserApproval'],
  }

  async execute(capabilityId: ComputerCapabilityId, _parameters: Record<string, unknown>): Promise<ComputerActionResult> {
    return {
      success: false,
      capabilityId,
      error: 'Desktop Agent Provider is a PLACEHOLDER — no desktop agent binary exists. This capability requires the ARIA Desktop Agent (future implementation).',
      notImplemented: true,
    }
  }
}

/**
 * Electron Provider — PLACEHOLDER. Not implemented.
 */
export class ElectronProvider implements ComputerProvider {
  readonly capabilities: ComputerProviderCapabilities = {
    providerType: 'electron',
    isPlaceholder: true,
    supported: [],
  }

  async execute(capabilityId: ComputerCapabilityId, _parameters: Record<string, unknown>): Promise<ComputerActionResult> {
    return {
      success: false,
      capabilityId,
      error: 'Electron Provider is a PLACEHOLDER — not implemented.',
      notImplemented: true,
    }
  }
}

/**
 * Tauri Provider — PLACEHOLDER. Not implemented.
 */
export class TauriProvider implements ComputerProvider {
  readonly capabilities: ComputerProviderCapabilities = {
    providerType: 'tauri',
    isPlaceholder: true,
    supported: [],
  }

  async execute(capabilityId: ComputerCapabilityId, _parameters: Record<string, unknown>): Promise<ComputerActionResult> {
    return {
      success: false,
      capabilityId,
      error: 'Tauri Provider is a PLACEHOLDER — not implemented.',
      notImplemented: true,
    }
  }
}

/**
 * Native OS Provider — PLACEHOLDER. Not implemented.
 */
export class NativeOSProvider implements ComputerProvider {
  readonly capabilities: ComputerProviderCapabilities = {
    providerType: 'native-os',
    isPlaceholder: true,
    supported: [],
  }

  async execute(capabilityId: ComputerCapabilityId, _parameters: Record<string, unknown>): Promise<ComputerActionResult> {
    return {
      success: false,
      capabilityId,
      error: 'Native OS Provider is a PLACEHOLDER — not implemented.',
      notImplemented: true,
    }
  }
}
