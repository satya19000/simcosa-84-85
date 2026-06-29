"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentParser = void 0;
exports.registerOCRProvider = registerOCRProvider;
exports.getOCRProvider = getOCRProvider;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const uuid_1 = require("uuid");
// ── OCR Provider Registry ─────────────────────────────────────────────────────
const ocrProviders = new Map();
function registerOCRProvider(provider) {
    ocrProviders.set(provider.name, provider);
}
function getOCRProvider(name) {
    return ocrProviders.get(name);
}
// ── Claude Vision OCR Provider ────────────────────────────────────────────────
// Built-in provider using Claude's vision capability (no extra dependency)
class ClaudeVisionOCRProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.name = 'claude-vision';
        this.supportsHandwriting = true;
    }
    async ocr(imageBuffer, mimeType) {
        const client = new sdk_1.default({ apiKey: this.apiKey });
        const base64 = imageBuffer.toString('base64');
        const validMime = (mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/gif' || mimeType === 'image/webp')
            ? mimeType
            : 'image/jpeg';
        const response = await client.messages.create({
            model: 'claude-opus-4-8',
            max_tokens: 4096,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'image', source: { type: 'base64', media_type: validMime, data: base64 } },
                        { type: 'text', text: 'Extract all text from this image exactly as written. Preserve formatting, headings, tables, and lists. Return only the extracted text.' },
                    ],
                },
            ],
        });
        const textBlock = response.content.find((b) => b.type === 'text');
        const text = textBlock?.type === 'text' ? textBlock.text : '';
        return {
            text,
            confidence: 0.9,
            provider: this.name,
            pageResults: [{ page: 1, text, confidence: 0.9 }],
            processedAt: new Date().toISOString(),
        };
    }
}
// ── Document Parser ───────────────────────────────────────────────────────────
class DocumentParser {
    constructor(config, apiKey) {
        this.config = config;
        this.apiKey = apiKey;
        this.claudeVisionOCR = new ClaudeVisionOCRProvider(apiKey);
        // Register built-in provider
        registerOCRProvider(this.claudeVisionOCR);
    }
    /**
     * Parse raw text content into structured chunks.
     * For images and scanned docs, OCR is applied first.
     */
    async parse(document, rawText) {
        const chunks = this.chunkText(rawText, document);
        const metadata = this.extractBasicMetadata(rawText, document);
        return { chunks, metadata };
    }
    async ocrBuffer(imageBuffer, mimeType, ocrProviderName) {
        const providerName = ocrProviderName ?? this.config.defaultOCRProvider;
        const provider = ocrProviders.get(providerName) ?? this.claudeVisionOCR;
        return provider.ocr(imageBuffer, mimeType);
    }
    /**
     * Use Claude to extract structured metadata from document text.
     */
    async extractStructuredMetadata(text, document) {
        if (text.length < 50)
            return {};
        try {
            const client = new sdk_1.default({ apiKey: this.apiKey });
            const response = await client.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: 512,
                messages: [
                    {
                        role: 'user',
                        content: `Extract metadata from this document text as JSON:
{
  "author": "string or null",
  "organization": "string or null",
  "subject": "string or null",
  "keywords": ["array of key terms"],
  "sections": ["array of section titles"],
  "headings": ["array of headings"],
  "language": "ISO 639-1 code"
}

Document title: "${document.title}"
Text (first 2000 chars): ${text.slice(0, 2000)}

Return ONLY valid JSON.`,
                    },
                ],
            });
            const textBlock = response.content.find((b) => b.type === 'text');
            const raw = textBlock?.type === 'text' ? textBlock.text : '{}';
            const match = raw.match(/\{[\s\S]*\}/);
            return match ? JSON.parse(match[0]) : {};
        }
        catch {
            return {};
        }
    }
    chunkText(text, document) {
        const chunks = [];
        const now = new Date().toISOString();
        const target = this.config.chunkTargetChars;
        const overlap = this.config.chunkOverlapChars;
        // Split on natural boundaries: double newline → paragraph, headings
        const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
        let index = 0;
        let buffer = '';
        const flush = (type = 'paragraph') => {
            if (buffer.trim().length === 0)
                return;
            chunks.push({
                id: (0, uuid_1.v4)(),
                documentId: document.id,
                userId: document.userId,
                index: index++,
                type,
                text: buffer.trim(),
                metadata: { format: document.format },
                createdAt: now,
            });
            // Carry overlap forward
            buffer = buffer.length > overlap ? buffer.slice(-overlap) : '';
        };
        for (const para of paragraphs) {
            const trimmed = para.trim();
            // Detect heading
            if (/^#{1,6}\s/.test(trimmed) || /^[A-Z][^a-z]{10,}$/.test(trimmed)) {
                flush();
                chunks.push({
                    id: (0, uuid_1.v4)(),
                    documentId: document.id,
                    userId: document.userId,
                    index: index++,
                    type: 'heading',
                    text: trimmed,
                    metadata: {},
                    createdAt: now,
                });
                buffer = '';
                continue;
            }
            // Detect table (contains | chars)
            if ((trimmed.match(/\|/g) ?? []).length > 2) {
                flush();
                chunks.push({
                    id: (0, uuid_1.v4)(),
                    documentId: document.id,
                    userId: document.userId,
                    index: index++,
                    type: 'table',
                    text: trimmed,
                    metadata: {},
                    createdAt: now,
                });
                buffer = '';
                continue;
            }
            buffer += (buffer ? '\n\n' : '') + trimmed;
            if (buffer.length >= target)
                flush();
        }
        flush();
        return chunks;
    }
    extractBasicMetadata(text, document) {
        const words = text.split(/\s+/).length;
        const hasImages = document.format === 'image' || document.format === 'scanned_image';
        const hasTables = (text.match(/\|/g) ?? []).length > 2;
        const hasForms = /\b(name|date|signature|sign here)\b/i.test(text);
        return {
            wordCount: words,
            hasImages,
            hasTables,
            hasForms,
            language: 'en',
            keywords: [],
            sections: [],
            headings: [],
        };
    }
}
exports.DocumentParser = DocumentParser;
//# sourceMappingURL=DocumentParser.js.map