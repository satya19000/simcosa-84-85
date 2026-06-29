"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentClassifier = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const CATEGORY_KEYWORDS = {
    medical: ['patient', 'diagnosis', 'prescription', 'medicine', 'doctor', 'hospital', 'treatment', 'disease', 'health'],
    government: ['circular', 'notification', 'order', 'ministry', 'department', 'gazette', 'act', 'regulation', 'official'],
    finance: ['invoice', 'payment', 'bank', 'account', 'balance', 'tax', 'budget', 'expense', 'revenue', 'profit'],
    legal: ['agreement', 'contract', 'clause', 'jurisdiction', 'court', 'plaintiff', 'defendant', 'legal', 'law'],
    personal: ['diary', 'note', 'personal', 'private', 'family', 'letter'],
    education: ['syllabus', 'marks', 'grade', 'exam', 'school', 'college', 'university', 'student', 'teacher'],
    research: ['abstract', 'methodology', 'hypothesis', 'conclusion', 'references', 'study', 'analysis', 'data'],
    public_health: ['malaria', 'vaccination', 'immunization', 'epidemic', 'outbreak', 'public health', 'surveillance'],
    meeting_notes: ['agenda', 'minutes', 'attendees', 'action items', 'decision', 'discussion', 'meeting'],
    project: ['project', 'milestone', 'deliverable', 'timeline', 'stakeholder', 'sprint', 'roadmap'],
    invoice: ['invoice', 'bill', 'total', 'gst', 'tax', 'amount due', 'payment terms'],
    receipt: ['receipt', 'paid', 'transaction', 'amount paid', 'cash', 'upi'],
    custom: [],
};
class DocumentClassifier {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    /**
     * Classify by keyword heuristics first, AI if ambiguous.
     */
    async classify(text, mimeType, filename) {
        // Quick heuristic
        const heuristic = this.heuristicClassify(text, filename);
        if (heuristic)
            return heuristic;
        // AI fallback
        return this.aiClassify(text, filename);
    }
    heuristicClassify(text, filename) {
        const lower = (text + ' ' + filename).toLowerCase();
        let bestCategory = null;
        let bestScore = 0;
        for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            if (keywords.length === 0)
                continue;
            const score = keywords.filter((kw) => lower.includes(kw)).length;
            if (score > bestScore) {
                bestScore = score;
                bestCategory = category;
            }
        }
        return bestScore >= 2 ? bestCategory : null;
    }
    async aiClassify(text, filename) {
        try {
            const client = new sdk_1.default({ apiKey: this.apiKey });
            const categories = Object.keys(CATEGORY_KEYWORDS).join(', ');
            const response = await client.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: 50,
                messages: [
                    {
                        role: 'user',
                        content: `Classify this document into exactly one category: ${categories}

Filename: ${filename}
Text (first 500 chars): ${text.slice(0, 500)}

Return ONLY the category name, nothing else.`,
                    },
                ],
            });
            const textBlock = response.content.find((b) => b.type === 'text');
            const raw = (textBlock?.type === 'text' ? textBlock.text.trim().toLowerCase() : '');
            return (CATEGORY_KEYWORDS[raw] !== undefined ? raw : 'custom');
        }
        catch {
            return 'custom';
        }
    }
    inferFormat(mimeType, filename) {
        const ext = filename.split('.').pop()?.toLowerCase() ?? '';
        const mime = mimeType.toLowerCase();
        if (mime.includes('pdf') || ext === 'pdf')
            return 'pdf';
        if (mime.includes('docx') || ext === 'docx')
            return 'docx';
        if (mime.includes('xlsx') || ext === 'xlsx')
            return 'xlsx';
        if (mime.includes('pptx') || ext === 'pptx')
            return 'pptx';
        if (mime.includes('csv') || ext === 'csv')
            return 'csv';
        if (mime.includes('rtf') || ext === 'rtf')
            return 'rtf';
        if (mime.includes('markdown') || ext === 'md')
            return 'md';
        if (mime.includes('text') || ext === 'txt')
            return 'txt';
        if (mime.includes('image')) {
            if (filename.toLowerCase().includes('scan'))
                return 'scanned_image';
            if (filename.toLowerCase().includes('screenshot'))
                return 'screenshot';
            return 'image';
        }
        return 'custom';
    }
}
exports.DocumentClassifier = DocumentClassifier;
//# sourceMappingURL=DocumentClassifier.js.map