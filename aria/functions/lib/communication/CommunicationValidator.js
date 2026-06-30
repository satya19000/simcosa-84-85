"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationValidator = void 0;
class CommunicationValidator {
    validateSendOptions(opts) {
        const errors = [];
        const warnings = [];
        if (!opts.to || opts.to.length === 0)
            errors.push('At least one recipient required');
        if (!opts.body || opts.body.trim().length === 0)
            errors.push('Message body cannot be empty');
        if (opts.body && opts.body.length > 100000)
            warnings.push('Message body is very long (>100k chars)');
        if (opts.attachments && opts.attachments.length > 25)
            warnings.push('More than 25 attachments may not be supported by all providers');
        return { valid: errors.length === 0, errors, warnings };
    }
    validateMessage(msg) {
        const errors = [];
        const warnings = [];
        if (!msg.userId)
            errors.push('userId required');
        if (!msg.threadId)
            errors.push('threadId required');
        if (!msg.providerId)
            errors.push('providerId required');
        if (!msg.body && msg.contentType !== 'image' && msg.contentType !== 'voice') {
            errors.push('body required for non-media messages');
        }
        return { valid: errors.length === 0, errors, warnings };
    }
    validateScheduledMessage(msg) {
        const errors = [];
        const warnings = [];
        if (!msg.userId)
            errors.push('userId required');
        if (!msg.providerId)
            errors.push('providerId required');
        if (!msg.to || msg.to.length === 0)
            errors.push('recipient required');
        if (!msg.body || msg.body.trim().length === 0)
            errors.push('body required');
        if (!msg.scheduledFor) {
            errors.push('scheduledFor required');
        }
        else if (new Date(msg.scheduledFor) <= new Date()) {
            errors.push('scheduledFor must be in the future');
        }
        return { valid: errors.length === 0, errors, warnings };
    }
}
exports.CommunicationValidator = CommunicationValidator;
//# sourceMappingURL=CommunicationValidator.js.map