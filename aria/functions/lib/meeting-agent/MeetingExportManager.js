"use strict";
/**
 * MeetingExportManager.ts — export interface definitions for meeting minutes.
 *
 * ARCHITECTURE NOTE: This is a placeholder architecture only.
 * Clean interfaces are defined for future export provider implementations.
 * No heavy export engine is implemented here.
 *
 * Supported formats (future): DOCX, PDF, Markdown, plain text.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingExportManager = exports.PdfExportProvider = exports.DocxExportProvider = exports.PlainTextExportProvider = exports.MarkdownExportProvider = void 0;
/**
 * Markdown export provider — real implementation.
 */
class MarkdownExportProvider {
    constructor() {
        this.format = 'markdown';
    }
    async export(notes) {
        // Import here to avoid circular dependency
        const { MeetingNotesManager } = await Promise.resolve().then(() => __importStar(require('./MeetingNotesManager')));
        const manager = new MeetingNotesManager(null);
        const content = manager.toMarkdown(notes);
        return {
            format: 'markdown',
            content,
            mimeType: 'text/markdown',
            fileName: `meeting-${notes.sessionId}.md`,
        };
    }
}
exports.MarkdownExportProvider = MarkdownExportProvider;
/**
 * Plain text export provider — real implementation.
 */
class PlainTextExportProvider {
    constructor() {
        this.format = 'plaintext';
    }
    async export(notes) {
        const { MeetingNotesManager } = await Promise.resolve().then(() => __importStar(require('./MeetingNotesManager')));
        const manager = new MeetingNotesManager(null);
        const content = manager.toPlainText(notes);
        return {
            format: 'plaintext',
            content,
            mimeType: 'text/plain',
            fileName: `meeting-${notes.sessionId}.txt`,
        };
    }
}
exports.PlainTextExportProvider = PlainTextExportProvider;
/**
 * DOCX export provider — placeholder (requires third-party library).
 */
class DocxExportProvider {
    constructor() {
        this.format = 'docx';
    }
    async export(_notes) {
        return {
            format: 'docx',
            content: '',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileName: `meeting-${_notes.sessionId}.docx`,
            notImplemented: true,
        };
    }
}
exports.DocxExportProvider = DocxExportProvider;
/**
 * PDF export provider — placeholder (requires Puppeteer or similar).
 */
class PdfExportProvider {
    constructor() {
        this.format = 'pdf';
    }
    async export(_notes) {
        return {
            format: 'pdf',
            content: '',
            mimeType: 'application/pdf',
            fileName: `meeting-${_notes.sessionId}.pdf`,
            notImplemented: true,
        };
    }
}
exports.PdfExportProvider = PdfExportProvider;
/**
 * MeetingExportManager — registry of export providers.
 */
class MeetingExportManager {
    constructor() {
        this.providers = new Map([
            ['markdown', new MarkdownExportProvider()],
            ['plaintext', new PlainTextExportProvider()],
            ['docx', new DocxExportProvider()],
            ['pdf', new PdfExportProvider()],
        ]);
    }
    async exportNotes(notes, format) {
        const provider = this.providers.get(format);
        if (!provider) {
            throw new Error(`Unsupported export format: ${format}`);
        }
        return provider.export(notes);
    }
    supportedFormats() {
        return Array.from(this.providers.keys());
    }
}
exports.MeetingExportManager = MeetingExportManager;
//# sourceMappingURL=MeetingExportManager.js.map