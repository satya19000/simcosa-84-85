"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeOSProvider = exports.TauriProvider = exports.ElectronProvider = exports.DesktopAgentProvider = exports.BrowserExtensionProvider = exports.WebPWAProvider = void 0;
/**
 * Web PWA Provider — the ONLY semi-functional provider.
 * Operates within what a web app can legitimately do via browser APIs
 * (conceptually: openUrl, copyToClipboard, uploadFileWithUserPicker).
 * All operations require user gesture; none are silent.
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
                // In a real web context this would call navigator.clipboard.writeText
                return { success: true, capabilityId, output: { action: 'clipboard_write', length: text.length } };
            }
            case 'readVisiblePage':
            case 'summarizeVisiblePage':
                // Page content reading is handled by Document Intelligence integration
                return { success: true, capabilityId, output: { action: 'read_page', note: 'Page content forwarded to Document Intelligence.' } };
            case 'uploadFileWithUserPicker':
                return { success: true, capabilityId, output: { action: 'file_picker_opened', note: 'Browser file picker opened — user controls file selection.' } };
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