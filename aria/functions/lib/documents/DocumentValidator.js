"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentValidator = void 0;
class DocumentValidator {
    constructor(config) {
        this.config = config;
    }
    validate(record) {
        const errors = [];
        const warnings = [];
        if (!record.title || record.title.trim().length === 0)
            errors.push('Title is required');
        if (!record.userId)
            errors.push('userId is required');
        if (!record.format)
            errors.push('format is required');
        if (!record.category)
            errors.push('category is required');
        if (!record.mimeType)
            warnings.push('mimeType not set');
        if (record.sizeBytes !== undefined && record.sizeBytes > this.config.maxFileSizeBytes) {
            errors.push(`File size ${record.sizeBytes} exceeds limit ${this.config.maxFileSizeBytes}`);
        }
        if (record.title && record.title.length > 500) {
            warnings.push('Title is very long (>500 chars)');
        }
        return { valid: errors.length === 0, errors, warnings };
    }
    validateForIngestion(userId, title, mimeType, sizeBytes) {
        return this.validate({ userId, title, mimeType, sizeBytes, format: 'custom', category: 'custom' });
    }
}
exports.DocumentValidator = DocumentValidator;
//# sourceMappingURL=DocumentValidator.js.map