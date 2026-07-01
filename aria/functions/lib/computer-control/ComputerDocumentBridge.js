"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerDocumentBridge = void 0;
const uuid_1 = require("uuid");
const DOC_COL = (tenantId) => `tenants/${tenantId}/computerDocuments`;
/**
 * ComputerDocumentBridge — bridges the Computer Control module to Document
 * Intelligence for file analysis.
 *
 * SAFETY INVARIANTS:
 * - Files are ONLY processed when the user explicitly selects them via the
 *   browser file picker (`<input type="file">`). Silent file access is impossible.
 * - suggestDocumentToTask and suggestDocumentToReminder return SUGGESTIONS ONLY —
 *   they NEVER auto-create tasks or reminders. User must explicitly approve.
 * - No file content is persisted in Firestore — only metadata and analysis results.
 * - AI Gateway is called for summary/action-item extraction if configured.
 *
 * Document Intelligence integration:
 * In this phase, the bridge performs its own lightweight text extraction from the
 * file content provided by the browser picker, then routes to AI Gateway for
 * summary and action item extraction. A full Document Intelligence integration
 * (with the `documents/` module) is deferred to Phase 5.7.
 */
class ComputerDocumentBridge {
    constructor(db) {
        this.db = db;
    }
    /**
     * Record that the user selected a file via the browser file picker.
     * Extracts metadata only — does not read file content until the user
     * explicitly requests analysis via analyzeSelectedDocument.
     */
    fileSelectedByUser(fileName, fileType, fileSizeBytes) {
        return {
            fileName,
            fileType,
            fileSizeBytes,
            source: 'browser-file-picker',
            selectedAt: new Date().toISOString(),
        };
    }
    /**
     * Extract file metadata from a DocumentAnalysisRequest.
     */
    extractFileMetadata(req) {
        return {
            fileName: req.fileName,
            fileType: req.fileType,
            fileSizeBytes: req.fileSizeBytes,
            source: 'browser-file-picker',
            selectedAt: new Date().toISOString(),
        };
    }
    /**
     * Hand off a file to Document Intelligence for analysis.
     * Performs lightweight extraction from base64 content and returns a
     * DocumentBridgeResult with summary and action items.
     *
     * NOTE: Full Document Intelligence module integration (indexing, semantic search,
     * multi-document chat) is deferred to Phase 5.7. This method performs a
     * structural analysis only.
     */
    async handoffToDocumentIntelligence(req, aiSummary, aiActionItems) {
        const documentId = (0, uuid_1.v4)();
        const analyzedAt = new Date().toISOString();
        // Decode base64 to get text length (no content stored)
        let textLength = 0;
        try {
            const decoded = Buffer.from(req.fileContentBase64, 'base64').toString('utf-8');
            textLength = decoded.length;
        }
        catch {
            textLength = 0;
        }
        const summary = aiSummary ?? this.generateStructuralSummary(req.fileName, req.fileType, req.fileSizeBytes, textLength);
        const actionItems = aiActionItems ?? [];
        const suggestedTasks = this.suggestDocumentToTask(documentId, req.tenantId, req.userId, actionItems);
        const suggestedReminders = this.suggestDocumentToReminder(documentId, req.tenantId, req.userId, actionItems);
        const result = {
            documentId,
            tenantId: req.tenantId,
            userId: req.userId,
            fileName: req.fileName,
            fileType: req.fileType,
            fileSizeBytes: req.fileSizeBytes,
            summary,
            actionItems,
            suggestedTasks,
            suggestedReminders,
            analyzedAt,
            aiGatewayUsed: !!aiSummary,
        };
        // Persist analysis metadata (not file content) to Firestore
        await this.db.collection(DOC_COL(req.tenantId)).doc(documentId).set({
            documentId,
            tenantId: req.tenantId,
            userId: req.userId,
            fileName: req.fileName,
            fileType: req.fileType,
            fileSizeBytes: req.fileSizeBytes,
            analyzedAt,
            aiGatewayUsed: result.aiGatewayUsed,
            actionItemCount: actionItems.length,
            // summary stored for display — no raw file content stored
            summary,
        });
        return result;
    }
    /**
     * Request a document summary. If an AI summary is provided (from AI Gateway),
     * it is used directly. Otherwise, a structural summary is generated.
     */
    async requestDocumentSummary(tenantId, userId, fileName, fileType, fileSizeBytes, aiSummary) {
        return aiSummary ?? this.generateStructuralSummary(fileName, fileType, fileSizeBytes, 0);
    }
    /**
     * Extract action items from a document analysis result.
     * If AI-extracted items are provided, they are returned directly.
     * Otherwise, returns an empty list (structural extraction not available without AI).
     */
    extractActionItems(aiItems) {
        return aiItems ?? [];
    }
    /**
     * Suggest creating tasks from document action items.
     * RETURNS SUGGESTIONS ONLY — never auto-creates tasks.
     * User must explicitly click "Create Task" and confirm in the UI.
     */
    suggestDocumentToTask(documentId, _tenantId, _userId, actionItems) {
        return actionItems
            .filter((item) => item.priority === 'high' || item.priority === 'medium')
            .slice(0, 5) // max 5 suggestions
            .map((item) => ({
            type: 'task',
            title: item.text.slice(0, 120),
            notes: `Suggested from document analysis. Priority: ${item.priority}.${item.suggestedDueDate ? ` Suggested due date: ${item.suggestedDueDate}.` : ''}`,
            sourcePlanId: '', // filled in by caller
            sourceDocumentId: documentId,
            _requiresUserApproval: true,
        }));
    }
    /**
     * Suggest creating reminders from document action items with dates.
     * RETURNS SUGGESTIONS ONLY — never auto-creates reminders.
     * User must explicitly click "Create Reminder" and confirm in the UI.
     */
    suggestDocumentToReminder(documentId, _tenantId, _userId, actionItems) {
        return actionItems
            .filter((item) => !!item.suggestedDueDate)
            .slice(0, 3) // max 3 reminder suggestions
            .map((item) => ({
            type: 'reminder',
            title: item.text.slice(0, 120),
            notes: `Reminder suggested from document analysis. Due: ${item.suggestedDueDate}.`,
            sourcePlanId: '',
            sourceDocumentId: documentId,
            _requiresUserApproval: true,
        }));
    }
    generateStructuralSummary(fileName, fileType, fileSizeBytes, textLength) {
        const sizeKB = Math.round(fileSizeBytes / 1024);
        const typeLabel = this.labelForMimeType(fileType);
        const textNote = textLength > 0 ? ` Contains approximately ${textLength.toLocaleString()} characters of text.` : '';
        return `${typeLabel} document: "${fileName}" (${sizeKB} KB).${textNote} Full AI analysis requires AI Gateway integration (Phase 5.7).`;
    }
    labelForMimeType(mimeType) {
        if (mimeType.includes('pdf'))
            return 'PDF';
        if (mimeType.includes('word') || mimeType.includes('docx'))
            return 'Word';
        if (mimeType.includes('text/plain'))
            return 'Text';
        if (mimeType.includes('csv'))
            return 'CSV';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
            return 'Spreadsheet';
        if (mimeType.includes('image'))
            return 'Image';
        return 'Document';
    }
}
exports.ComputerDocumentBridge = ComputerDocumentBridge;
//# sourceMappingURL=ComputerDocumentBridge.js.map