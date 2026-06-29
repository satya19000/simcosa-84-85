"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationAgent = exports.OCRAgent = exports.DocumentAgent = exports.HealthAgent = exports.FinanceAgent = exports.MapsAgent = exports.WhatsAppAgent = exports.EmailAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
class PlaceholderAgent extends BaseAgent_1.BaseAgent {
    constructor(id, name, description, capability) {
        super();
        this.manifest = { id, name, description, version: '0.0.0', capabilities: [capability], placeholder: true };
    }
    canHandle(_task) {
        return false;
    }
    async execute(task, ctx) {
        return this.makeErrorResult(task, ctx, `${this.manifest.name} is not yet implemented`, Date.now());
    }
}
exports.EmailAgent = new PlaceholderAgent('email-agent', 'Email Agent', 'Reads and sends emails', 'email');
exports.WhatsAppAgent = new PlaceholderAgent('whatsapp-agent', 'WhatsApp Agent', 'Sends WhatsApp messages', 'whatsapp');
exports.MapsAgent = new PlaceholderAgent('maps-agent', 'Maps Agent', 'Location and navigation', 'maps');
exports.FinanceAgent = new PlaceholderAgent('finance-agent', 'Finance Agent', 'Financial data and budgets', 'finance');
exports.HealthAgent = new PlaceholderAgent('health-agent', 'Health Agent', 'Health and fitness tracking', 'health');
exports.DocumentAgent = new PlaceholderAgent('document-agent', 'Document Agent', 'Document generation and editing', 'document');
exports.OCRAgent = new PlaceholderAgent('ocr-agent', 'OCR Agent', 'Optical character recognition', 'ocr');
exports.AutomationAgent = new PlaceholderAgent('automation-agent', 'Automation Agent', 'Custom automations and integrations', 'automation');
//# sourceMappingURL=PlaceholderAgents.js.map