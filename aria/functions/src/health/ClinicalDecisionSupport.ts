import Anthropic from '@anthropic-ai/sdk'
import type {
  Patient, Medication, DecisionSupportRule, DecisionSupportResult, DiseaseInfo,
} from './HealthTypes'

const DISCLAIMER =
  'This is decision support only, generated from available records and general clinical guidelines. ' +
  'It is not a diagnosis. A qualified healthcare professional must review and confirm any clinical decision.'

// ── Clinical Decision Support ────────────────────────────────────────────────
// Rule engine + AI-assisted checklist/protocol suggestions. Never produces a
// final diagnosis — always frames output as recommendations for a clinician.

export class ClinicalDecisionSupport {
  private readonly client: Anthropic
  private readonly rules: DecisionSupportRule[] = []

  constructor(apiKey: string, private readonly budgetTokens: number) {
    this.client = new Anthropic({ apiKey })
  }

  registerRule(rule: DecisionSupportRule): void {
    this.rules.push(rule)
  }

  listRules(): DecisionSupportRule[] {
    return [...this.rules]
  }

  evaluateRules(patient: Patient, medications: Medication[] = []): DecisionSupportResult['recommendations'] {
    const recs: DecisionSupportResult['recommendations'] = []
    for (const rule of this.rules) {
      try {
        if (rule.condition({ patient, medications })) {
          recs.push({ rule: rule.name, text: rule.recommendation, severity: rule.severity })
        }
      } catch {
        // a single faulty plugin rule must never break decision support
      }
    }
    return recs
  }

  async generateSupport(
    patient: Patient,
    medications: Medication[],
    relevantDiseases: DiseaseInfo[]
  ): Promise<DecisionSupportResult> {
    const ruleRecs = this.evaluateRules(patient, medications)
    let aiChecklists: string[] = []
    let missingInformation: string[] = []
    let aiRecs: DecisionSupportResult['recommendations'] = []

    try {
      const diseaseContext = relevantDiseases
        .map((d) => `${d.name}: symptoms=[${d.symptoms.join(', ')}] guidelines=[${d.guidelines.join('; ')}]`)
        .join('\n')

      const response = await this.client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        thinking: { type: 'enabled', budget_tokens: this.budgetTokens },
        messages: [
          {
            role: 'user',
            content:
              `You are a clinical decision SUPPORT assistant. Never provide a final diagnosis. ` +
              `Always phrase output as recommendations for a clinician to review.\n\n` +
              `Patient: ${patient.demographics.fullName}, allergies=[${patient.allergies.map((a) => a.substance).join(', ')}], ` +
              `medical history=[${patient.medicalHistory.map((h) => h.condition).join(', ')}], ` +
              `current medications=[${medications.map((m) => m.name).join(', ')}].\n\n` +
              `Relevant disease/program guidelines:\n${diseaseContext}\n\n` +
              `Return JSON only: { "recommendations": [{"text": string, "severity": "info"|"warning"|"alert"}], ` +
              `"checklists": string[], "missingInformation": string[] }`,
          },
        ],
      })
      const block = response.content.find((b) => b.type === 'text')
      const raw = block?.type === 'text' ? block.text : '{}'
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0]) as {
          recommendations?: Array<{ text: string; severity: 'info' | 'warning' | 'alert' }>
          checklists?: string[]
          missingInformation?: string[]
        }
        aiRecs = (parsed.recommendations ?? []).map((r) => ({ rule: 'ai_suggestion', text: r.text, severity: r.severity }))
        aiChecklists = parsed.checklists ?? []
        missingInformation = parsed.missingInformation ?? []
      }
    } catch {
      // AI suggestions are best-effort; rule engine output still returned
    }

    return {
      patientId: patient.id,
      recommendations: [...ruleRecs, ...aiRecs],
      checklists: aiChecklists,
      missingInformation,
      generatedAt: new Date().toISOString(),
      disclaimer: DISCLAIMER,
    }
  }
}
