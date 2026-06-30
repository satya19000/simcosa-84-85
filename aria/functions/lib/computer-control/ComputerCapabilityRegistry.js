"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerCapabilityRegistry = void 0;
/**
 * Registry of all supported computer capabilities.
 *
 * Each capability carries the metadata required for the planner, safety guard,
 * permissions engine, and UI to display risk indicators and approval badges.
 *
 * credentialAccess is registered as alwaysBlocked=true — ComputerSafetyGuard
 * unconditionally rejects it regardless of any permission or approval state.
 * paymentAction is registered as policyBlocked=true — blocked at the policy
 * level by default but the field exists so admins can see it in the registry.
 */
const CAPABILITIES = [
    {
        id: 'readVisiblePage',
        name: 'Read Visible Page',
        description: 'Read the text content of the currently visible browser page (no hidden tabs, no cross-origin frames).',
        riskLevel: 'low',
        requiredPermissions: ['computer.readPage'],
        requiresApproval: false,
        reversible: true,
        auditRequired: true,
    },
    {
        id: 'summarizeVisiblePage',
        name: 'Summarize Visible Page',
        description: 'Summarize the text content of the currently visible browser page.',
        riskLevel: 'low',
        requiredPermissions: ['computer.readPage'],
        requiresApproval: false,
        reversible: true,
        auditRequired: true,
    },
    {
        id: 'openUrl',
        name: 'Open URL',
        description: 'Open a URL in the user\'s browser.',
        riskLevel: 'low',
        requiredPermissions: ['computer.openUrl'],
        requiresApproval: false,
        reversible: true,
        auditRequired: true,
    },
    {
        id: 'searchWeb',
        name: 'Search Web',
        description: 'Open a web search query in the user\'s browser.',
        riskLevel: 'low',
        requiredPermissions: ['computer.openUrl', 'computer.network.request'],
        requiresApproval: false,
        reversible: true,
        auditRequired: true,
    },
    {
        id: 'copyToClipboard',
        name: 'Copy To Clipboard',
        description: 'Write ARIA-generated text to the user\'s clipboard. The user sees what is being written.',
        riskLevel: 'low',
        requiredPermissions: ['computer.clipboard.write'],
        requiresApproval: false,
        reversible: true,
        auditRequired: true,
    },
    {
        id: 'pasteFromClipboard',
        name: 'Paste From Clipboard',
        description: 'Suggest clipboard content be pasted at a target location — requires explicit user gesture.',
        riskLevel: 'medium',
        requiredPermissions: ['computer.clipboard.read'],
        requiresApproval: true,
        reversible: true,
        auditRequired: true,
    },
    {
        id: 'readClipboard',
        name: 'Read Clipboard',
        description: 'Read the current contents of the clipboard with user awareness. Requires explicit approval.',
        riskLevel: 'medium',
        requiredPermissions: ['computer.clipboard.read'],
        requiresApproval: true,
        reversible: true,
        auditRequired: true,
    },
    {
        id: 'uploadFileWithUserPicker',
        name: 'Upload File (User Picker)',
        description: 'Open the browser file picker so the user can choose a file to upload. The user controls selection.',
        riskLevel: 'low',
        requiredPermissions: ['computer.files.read'],
        requiresApproval: false,
        reversible: true,
        auditRequired: true,
    },
    {
        id: 'downloadFileWithUserApproval',
        name: 'Download File (User Approval)',
        description: 'Trigger a browser download after the user explicitly approves the file and destination.',
        riskLevel: 'medium',
        requiredPermissions: ['computer.files.write'],
        requiresApproval: true,
        reversible: true,
        auditRequired: true,
    },
    {
        id: 'screenshotWithApproval',
        name: 'Screenshot (With Approval)',
        description: 'Capture a screenshot of the current visible page after explicit user approval. Never silent.',
        riskLevel: 'medium',
        requiredPermissions: ['computer.screenshot'],
        requiresApproval: true,
        reversible: true,
        auditRequired: true,
    },
    {
        id: 'ocrScreenshot',
        name: 'OCR Screenshot',
        description: 'Extract text from an approved screenshot using OCR.',
        riskLevel: 'medium',
        requiredPermissions: ['computer.screenshot', 'computer.ocr'],
        requiresApproval: true,
        reversible: true,
        auditRequired: true,
    },
    {
        id: 'listBrowserTabs',
        name: 'List Browser Tabs',
        description: 'List open browser tabs. PLACEHOLDER — requires browser extension not yet implemented.',
        riskLevel: 'medium',
        requiredPermissions: ['computer.browser.tabs'],
        requiresApproval: true,
        reversible: true,
        auditRequired: true,
    },
    {
        id: 'switchTab',
        name: 'Switch Browser Tab',
        description: 'Switch to a specific browser tab. PLACEHOLDER — requires browser extension not yet implemented.',
        riskLevel: 'medium',
        requiredPermissions: ['computer.browser.tabs'],
        requiresApproval: true,
        reversible: true,
        auditRequired: true,
    },
    {
        id: 'openApp',
        name: 'Open Application',
        description: 'Open a desktop application. PLACEHOLDER — requires desktop agent not yet implemented.',
        riskLevel: 'medium',
        requiredPermissions: ['computer.apps.open'],
        requiresApproval: true,
        reversible: true,
        auditRequired: true,
    },
    {
        id: 'createFile',
        name: 'Create File',
        description: 'Create a new file on the local filesystem. PLACEHOLDER — requires desktop agent not yet implemented.',
        riskLevel: 'medium',
        requiredPermissions: ['computer.files.write'],
        requiresApproval: true,
        reversible: true,
        auditRequired: true,
    },
    {
        id: 'moveFile',
        name: 'Move File',
        description: 'Move a file to a new location. PLACEHOLDER — requires desktop agent not yet implemented.',
        riskLevel: 'medium',
        requiredPermissions: ['computer.files.write'],
        requiresApproval: true,
        reversible: true,
        auditRequired: true,
    },
    {
        id: 'renameFile',
        name: 'Rename File',
        description: 'Rename a file. PLACEHOLDER — requires desktop agent not yet implemented.',
        riskLevel: 'medium',
        requiredPermissions: ['computer.files.write'],
        requiresApproval: true,
        reversible: false,
        auditRequired: true,
    },
    {
        id: 'deleteFile',
        name: 'Delete File',
        description: 'Delete a file. High-risk: irreversible. Always requires explicit approval before execution.',
        riskLevel: 'high',
        requiredPermissions: ['computer.files.delete'],
        requiresApproval: true,
        reversible: false,
        auditRequired: true,
    },
    {
        id: 'sendMessage',
        name: 'Send Message',
        description: 'Send an email, chat, or SMS message. Always requires explicit approval before execution.',
        riskLevel: 'high',
        requiredPermissions: ['computer.network.request'],
        requiresApproval: true,
        reversible: false,
        auditRequired: true,
    },
    {
        id: 'submitForm',
        name: 'Submit Web Form',
        description: 'Submit a web form. Always requires explicit approval; cannot be auto-submitted.',
        riskLevel: 'high',
        requiredPermissions: ['computer.forms.submit'],
        requiresApproval: true,
        reversible: false,
        auditRequired: true,
    },
    {
        id: 'paymentAction',
        name: 'Payment Action',
        description: 'Initiate a financial payment. Blocked by default policy. Requires approval AND policy override.',
        riskLevel: 'critical',
        requiredPermissions: ['computer.forms.submit', 'computer.network.request'],
        requiresApproval: true,
        reversible: false,
        auditRequired: true,
        policyBlocked: true, // blocked at policy level by default
    },
    {
        id: 'credentialAccess',
        name: 'Credential Access',
        description: 'Access saved passwords, session cookies, or private keys. ALWAYS BLOCKED — no bypass path exists.',
        riskLevel: 'critical',
        requiredPermissions: [],
        requiresApproval: true,
        reversible: false,
        auditRequired: true,
        alwaysBlocked: true, // ComputerSafetyGuard unconditionally rejects this
        policyBlocked: true,
    },
];
class ComputerCapabilityRegistry {
    constructor() {
        this.map = new Map(CAPABILITIES.map((c) => [c.id, c]));
    }
    getAll() {
        return [...this.map.values()];
    }
    get(id) {
        return this.map.get(id) ?? null;
    }
    listAvailable() {
        return this.getAll().filter((c) => !c.alwaysBlocked);
    }
    isAlwaysBlocked(id) {
        return this.map.get(id)?.alwaysBlocked === true;
    }
    isPolicyBlocked(id) {
        return this.map.get(id)?.policyBlocked === true;
    }
    requiresApproval(id) {
        return this.map.get(id)?.requiresApproval === true;
    }
}
exports.ComputerCapabilityRegistry = ComputerCapabilityRegistry;
//# sourceMappingURL=ComputerCapabilityRegistry.js.map