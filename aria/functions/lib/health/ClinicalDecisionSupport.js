"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalDecisionSupport = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const DISCLAIMER = 'This is decision support only, generated from available records and general clinical guidelines. ' +
    'It is not a diagnosis. A qualified healthcare professional must review and confirm any clinical decision.';
// ── Clinical Decision Support ────────────────────────────────────────────────
// Rule engine + AI-assisted checklist/protocol suggestions. Never produces a
// final diagnosis — always frames output as recommendations for a clinician.
class ClinicalDecisionSupport {
    constructor(apiKey, budgetTokens) {
        this.budgetTokens = budgetTokens;
        this.rules = [];
        this.client = new sdk_1.default({ apiKey });
    }
    registerRule(rule) {
        this.rules.push(rule);
    }
    listRules() {
        return [...this.rules];
    }
    evaluateRules(patient, medications = []) {
        const recs = [];
        for (const rule of this.rules) {
            try {
                if (rule.condition({ patient, medications })) {
                    recs.push({ rule: rule.name, text: rule.recommendation, severity: rule.severity });
                }
            }
            catch {
                // a single faulty plugin rule must never break decision support
            }
        }
        return recs;
    }
    async generateSupport(patient, medications, relevantDiseases) {
        const ruleRecs = this.evaluateRules(patient, medications);
        let aiChecklists = [];
        let missingInformation = [];
        let aiRecs = [];
        try {
            const diseaseContext = relevantDiseases
                .map((d) => `${d.name}: symptoms=[${d.symptoms.join(', ')}] guidelines=[${d.guidelines.join('; ')}]`)
                .join('\n');
            const response = await this.client.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: 1024,
                thinking: { type: 'enabled', budget_tokens: this.budgetTokens },
                messages: [
                    {
                        role: 'user',
                        content: `You are a clinical decision SUPPORT assistant. Never provide a final diagnosis. ` +
                            `Always phrase output as recommendations for a clinician to review.\n\n` +
                            `Patient: ${patient.demographics.fullName}, allergies=[${patient.allergies.map((a) => a.substance).join(', ')}], ` +
                            `medical history=[${patient.medicalHistory.map((h) => h.condition).join(', ')}], ` +
                            `current medications=[${medications.map((m) => m.name).join(', ')}].\n\n` +
                            `Relevant disease/program guidelines:\n${diseaseContext}\n\n` +
                            `Return JSON only: { "recommendations": [{"text": string, "severity": "info"|"warning"|"alert"}], ` +
                            `"checklists": string[], "missingInformation": string[] }`,
                    },
                ],
            });
            const block = response.content.find((b) => b.type === 'text');
            const raw = block?.type === 'text' ? block.text : '{}';
            const match = raw.match(/\{[\s\S]*\}/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                aiRecs = (parsed.recommendations ?? []).map((r) => ({ rule: 'ai_suggestion', text: r.text, severity: r.severity }));
                aiChecklists = parsed.checklists ?? [];
                missingInformation = parsed.missingInformation ?? [];
            }
        }
        catch {
            // AI suggestions are best-effort; rule engine output still returned
        }
        return {
            patientId: patient.id,
            recommendations: [...ruleRecs, ...aiRecs],
            checklists: aiChecklists,
            missingInformation,
            generatedAt: new Date().toISOString(),
            disclaimer: DISCLAIMER,
        };
    }
}
exports.ClinicalDecisionSupport = ClinicalDecisionSupport;
//# sourceMappingURL=ClinicalDecisionSupport.js.map