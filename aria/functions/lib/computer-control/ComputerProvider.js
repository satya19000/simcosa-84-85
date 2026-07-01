"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeOSProvider = exports.TauriProvider = exports.ElectronProvider = exports.DesktopAgentProvider = exports.BrowserExtensionProvider = exports.ElectronDesktopProvider = exports.WebPWAProvider = void 0;
/**
 * Web PWA Provider — the ONLY semi-functional provider.
 * Operates within what a web app can legitimately do via browser APIs.
 * All operations require user gesture; none are silent.
 *
 * Phase 5.6 additions:
 * - openUrl: opens a URL (browser-side window.open)
 * - copyToClipboard: writes text to clipboard (user-visible confirmation required in UI)
 * - uploadFileWithUserPicker: opens browser <input type="file"> — user controls selection
 * - downloadFileWithUserApproval: approval-gated download (audit-only at server side;
 *   actual file transfer happens browser-side after approval is verified)
 * - summarizeVisiblePage: PLACEHOLDER — returns structured not-implemented; real
 *   summarization requires AI Gateway integration (Phase 5.7)
 * - screenshotWithApproval: PLACEHOLDER — requires approval; actual screen capture
 *   is not possible from a server-side Cloud Function; browser extension needed
 */
class WebPWAProvider {
    constructor() {
        this.capabilities = {
            providerType: 'web-pwa',
            isPlaceholder: false,
            supported: [
                'readVisiblePage',
                'summarizeVisiblePage',
                'openUrl',
                'searchWeb',
                'copyToClipboard',
                'uploadFileWithUserPicker',
                'downloadFileWithUserApproval',
                'screenshotWithApproval',
            ],
        };
    }
    async execute(capabilityId, parameters) {
        switch (capabilityId) {
            case 'openUrl': {
                const url = typeof parameters.url === 'string' ? parameters.url : null;
                if (!url)
                    return { success: false, capabilityId, error: 'url parameter required' };
                // In a real web context this would call window.open; here we return the intent
                return { success: true, capabilityId, output: { action: 'open_url', url } };
            }
            case 'searchWeb': {
                const query = typeof parameters.query === 'string' ? parameters.query : '';
                const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                return { success: true, capabilityId, output: { action: 'open_url', url } };
            }
            case 'copyToClipboard': {
                const text = typeof parameters.text === 'string' ? parameters.text : '';
                // In a real web context this would call navigator.clipboard.writeText.
                // The UI MUST show a confirmation to the user before calling this.
                return {
                    success: true,
                    capabilityId,
                    output: {
                        action: 'clipboard_write',
                        length: text.length,
                        note: 'User-visible confirmation required in UI before calling clipboard write.',
                    },
                };
            }
            case 'readVisiblePage':
                // Page content reading is handled by Document Intelligence integration
                return {
                    success: true,
                    capabilityId,
                    output: { action: 'read_page', note: 'Page content forwarded to Document Intelligence.' },
                };
            case 'summarizeVisiblePage':
                // PLACEHOLDER — real summarization requires AI Gateway + page content from browser.
                // Phase 5.7 will integrate ComputerDocumentBridge with the AI Gateway for this.
                return {
                    success: false,
                    capabilityId,
                    notImplemented: true,
                    error: 'summarizeVisiblePage requires AI Gateway integration (Phase 5.7). ' +
                        'Use analyzeSelectedDocument Cloud Function for file-based summarization.',
                };
            case 'uploadFileWithUserPicker':
                // Browser <input type="file"> — user controls file selection entirely.
                return {
                    success: true,
                    capabilityId,
                    output: {
                        action: 'file_picker_opened',
                        note: 'Browser file picker opened — user controls file selection. No silent file access.',
                    },
                };
            case 'downloadFileWithUserApproval':
                // Approval-gated download. The actual file transfer is browser-side;
                // server-side we only verify approval and audit. This is NOT a real download
                // from a server — the Cloud Function handles approval + audit only.
                return {
                    success: true,
                    capabilityId,
                    output: {
                        action: 'download_approved',
                        note: 'Download approval verified. Actual file transfer must be triggered browser-side. ' +
                            'Server-side download is NOT implemented in the web-pwa provider.',
                        notImplemented: true,
                    },
                };
            case 'screenshotWithApproval':
                // PLACEHOLDER — actual screen capture is not possible from a Cloud Function.
                // Requires a browser extension or desktop agent (Phase 5.7+).
                return {
                    success: false,
                    capabilityId,
                    notImplemented: true,
                    error: 'screenshotWithApproval requires a browser extension or desktop agent. ' +
                        'This capability is a PLACEHOLDER in the web-pwa provider — no screen capture occurs.',
                };
            default:
                return {
                    success: false,
                    capabilityId,
                    error: `WebPWAProvider does not support capability "${capabilityId}".`,
                    notImplemented: true,
                };
        }
    }
}
exports.WebPWAProvider = WebPWAProvider;
/**
 * Electron Desktop Provider — PLACEHOLDER.
 *
 * IMPORTANT: This provider is NOT functional. No Electron app binary, installer,
 * or desktop agent exists. ALL methods unconditionally return
 * { success: false, notImplemented: true }. This class exists as an architecture
 * placeholder for the future ARIA Desktop Agent (Phase 5.7+).
 *
 * Future plan:
 * 1. Build an Electron (or Tauri) desktop app with a local HTTP server.
 * 2. Implement mutual auth with public key challenge/response.
 * 3. Capability grants controlled by ARIA server via LocalBridge.
 * 4. All actions still routed through ComputerApprovalBridge.
 * 5. No capability executes without being in the agent's capabilityGrant.
 */
class ElectronDesktopProvider {
    constructor() {
        this.capabilities = {
            providerType: 'electron',
            isPlaceholder: true,
            supported: [], // Empty — nothing is implemented
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async execute(capabilityId, _parameters) {
        return {
            success: false,
            capabilityId,
            notImplemented: true,
            error: 'ElectronDesktopProvider is a PLACEHOLDER — no Electron app binary or installer exists. ' +
                'This capability requires the future ARIA Desktop Agent (Phase 5.7+). ' +
                'All methods unconditionally return { success: false, notImplemented: true }.',
        };
    }
}
exports.ElectronDesktopProvider = ElectronDesktopProvider;
/**
 * Browser Extension Provider — PLACEHOLDER.
 * No browser extension package is built or published.
 * Returns structured "not implemented" for all capabilities.
 */
class BrowserExtensionProvider {
    constructor() {
        this.capabilities = {
            providerType: 'browser-extension',
            isPlaceholder: true,
            supported: ['listBrowserTabs', 'switchTab', 'screenshotWithApproval', 'ocrScreenshot', 'readClipboard', 'pasteFromClipboard'],
        };
    }
    async execute(capabilityId, _parameters) {
        return {
            success: false,
            capabilityId,
            error: 'Browser Extension Provider is a PLACEHOLDER — no extension is installed or published. This capability requires installing a future ARIA browser extension.',
            notImplemented: true,
        };
    }
}
exports.BrowserExtensionProvider = BrowserExtensionProvider;
/**
 * Desktop Agent Provider — PLACEHOLDER.
 * No desktop agent binary or installer exists.
 * Returns structured "not implemented" for all capabilities.
 */
class DesktopAgentProvider {
    constructor() {
        this.capabilities = {
            providerType: 'desktop-agent',
            isPlaceholder: true,
            supported: ['openApp', 'createFile', 'moveFile', 'renameFile', 'deleteFile', 'downloadFileWithUserApproval'],
        };
    }
    async execute(capabilityId, _parameters) {
        return {
            success: false,
            capabilityId,
            error: 'Desktop Agent Provider is a PLACEHOLDER — no desktop agent binary exists. This capability requires the ARIA Desktop Agent (future implementation).',
            notImplemented: true,
        };
    }
}
exports.DesktopAgentProvider = DesktopAgentProvider;
/**
 * Electron Provider — PLACEHOLDER. Not implemented.
 */
class ElectronProvider {
    constructor() {
        this.capabilities = {
            providerType: 'electron',
            isPlaceholder: true,
            supported: [],
        };
    }
    async execute(capabilityId, _parameters) {
        return {
            success: false,
            capabilityId,
            error: 'Electron Provider is a PLACEHOLDER — not implemented.',
            notImplemented: true,
        };
    }
}
exports.ElectronProvider = ElectronProvider;
/**
 * Tauri Provider — PLACEHOLDER. Not implemented.
 */
class TauriProvider {
    constructor() {
        this.capabilities = {
            providerType: 'tauri',
            isPlaceholder: true,
            supported: [],
        };
    }
    async execute(capabilityId, _parameters) {
        return {
            success: false,
            capabilityId,
            error: 'Tauri Provider is a PLACEHOLDER — not implemented.',
            notImplemented: true,
        };
    }
}
exports.TauriProvider = TauriProvider;
/**
 * Native OS Provider — PLACEHOLDER. Not implemented.
 */
class NativeOSProvider {
    constructor() {
        this.capabilities = {
            providerType: 'native-os',
            isPlaceholder: true,
            supported: [],
        };
    }
    async execute(capabilityId, _parameters) {
        return {
            success: false,
            capabilityId,
            error: 'Native OS Provider is a PLACEHOLDER — not implemented.',
            notImplemented: true,
        };
    }
}
exports.NativeOSProvider = NativeOSProvider;
//# sourceMappingURL=ComputerProvider.js.map