import type { ApprovalLevel, ApprovalTriggerType, RiskFactors } from './ApprovalTypes'

export interface ApprovalTemplate {
  triggerType: ApprovalTriggerType
  titlePattern: string
  summaryPattern: string
  reasonPattern: string
  defaultRiskFactors: RiskFactors
  defaultApprovalLevel: ApprovalLevel
}

const templates = new Map<ApprovalTriggerType, ApprovalTemplate>()

function register(t: ApprovalTemplate): void {
  templates.set(t.triggerType, t)
}

// ── Built-in templates ───────────────────────────────────────────────────────
register({
  triggerType: 'send_email',
  titlePattern: 'Send email: {{subject}}',
  summaryPattern: 'ARIA has drafted an email to {{recipient}} and is ready to send it.',
  reasonPattern: 'Outbound communication requires explicit approval before sending.',
  defaultRiskFactors: { externalCommunication: true, financialImpact: 0, healthImpact: false, privacyImpact: false, irreversible: true, aiConfidence: 0.8 },
  defaultApprovalLevel: 'simple',
})
register({
  triggerType: 'send_whatsapp',
  titlePattern: 'Send WhatsApp message: {{recipient}}',
  summaryPattern: 'ARIA has drafted a WhatsApp message to {{recipient}} and is ready to send it.',
  reasonPattern: 'Outbound communication requires explicit approval before sending.',
  defaultRiskFactors: { externalCommunication: true, financialImpact: 0, healthImpact: false, privacyImpact: false, irreversible: true, aiConfidence: 0.8 },
  defaultApprovalLevel: 'simple',
})
register({
  triggerType: 'delete_documents',
  titlePattern: 'Delete {{count}} document(s)',
  summaryPattern: 'ARIA recommends deleting {{count}} document(s) matching: {{criteria}}.',
  reasonPattern: 'Deletion is irreversible and requires explicit approval.',
  defaultRiskFactors: { externalCommunication: false, financialImpact: 0, healthImpact: false, privacyImpact: true, irreversible: true, aiConfidence: 0.7 },
  defaultApprovalLevel: 'standard',
})
register({
  triggerType: 'delete_contacts',
  titlePattern: 'Delete {{count}} contact(s)',
  summaryPattern: 'ARIA recommends deleting {{count}} contact(s) matching: {{criteria}}.',
  reasonPattern: 'Deletion is irreversible and requires explicit approval.',
  defaultRiskFactors: { externalCommunication: false, financialImpact: 0, healthImpact: false, privacyImpact: true, irreversible: true, aiConfidence: 0.7 },
  defaultApprovalLevel: 'standard',
})
register({
  triggerType: 'delete_memories',
  titlePattern: 'Delete {{count}} memory node(s)',
  summaryPattern: 'ARIA recommends pruning {{count}} memory graph node(s): {{criteria}}.',
  reasonPattern: 'Memory graph deletions are irreversible and requires explicit approval.',
  defaultRiskFactors: { externalCommunication: false, financialImpact: 0, healthImpact: false, privacyImpact: true, irreversible: true, aiConfidence: 0.6 },
  defaultApprovalLevel: 'standard',
})
register({
  triggerType: 'financial_payment',
  titlePattern: 'Authorize payment of {{amount}}',
  summaryPattern: 'ARIA recommends authorizing a payment of {{amount}} to {{payee}}.',
  reasonPattern: 'Financial payments always require explicit human approval.',
  defaultRiskFactors: { externalCommunication: false, financialImpact: 0.8, healthImpact: false, privacyImpact: false, irreversible: true, aiConfidence: 0.7 },
  defaultApprovalLevel: 'executive',
})
register({
  triggerType: 'medical_decision',
  titlePattern: 'Medical decision: {{summary}}',
  summaryPattern: 'ARIA recommends a medical decision/action: {{summary}}.',
  reasonPattern: 'Medical decisions always require explicit human approval.',
  defaultRiskFactors: { externalCommunication: false, financialImpact: 0, healthImpact: true, privacyImpact: true, irreversible: true, aiConfidence: 0.6 },
  defaultApprovalLevel: 'executive',
})
register({
  triggerType: 'health_record_update',
  titlePattern: 'Update health record: {{recordType}}',
  summaryPattern: 'ARIA recommends updating a health record: {{recordType}}.',
  reasonPattern: 'Health record updates always require explicit human approval.',
  defaultRiskFactors: { externalCommunication: false, financialImpact: 0, healthImpact: true, privacyImpact: true, irreversible: false, aiConfidence: 0.7 },
  defaultApprovalLevel: 'manager',
})
register({
  triggerType: 'bulk_operation',
  titlePattern: 'Bulk operation: {{operation}} on {{count}} item(s)',
  summaryPattern: 'ARIA recommends a bulk {{operation}} affecting {{count}} item(s).',
  reasonPattern: 'Bulk operations have wide blast radius and require explicit approval.',
  defaultRiskFactors: { externalCommunication: false, financialImpact: 0.2, healthImpact: false, privacyImpact: false, irreversible: true, aiConfidence: 0.6 },
  defaultApprovalLevel: 'standard',
})
register({
  triggerType: 'external_api_call',
  titlePattern: 'External API call: {{endpoint}}',
  summaryPattern: 'ARIA recommends calling external API {{endpoint}} with the prepared payload.',
  reasonPattern: 'Calls outside the system boundary require explicit approval.',
  defaultRiskFactors: { externalCommunication: true, financialImpact: 0, healthImpact: false, privacyImpact: false, irreversible: false, aiConfidence: 0.7 },
  defaultApprovalLevel: 'simple',
})
register({
  triggerType: 'plugin_installation',
  titlePattern: 'Install plugin: {{pluginName}}',
  summaryPattern: 'ARIA recommends installing plugin "{{pluginName}}".',
  reasonPattern: 'Plugin installation grants new code execution capability and always requires explicit approval.',
  defaultRiskFactors: { externalCommunication: false, financialImpact: 0, healthImpact: false, privacyImpact: true, irreversible: false, aiConfidence: 0.5 },
  defaultApprovalLevel: 'executive',
})

export function getTemplate(triggerType: ApprovalTriggerType): ApprovalTemplate | undefined {
  return templates.get(triggerType)
}

export function listTemplates(): ApprovalTemplate[] {
  return [...templates.values()]
}

export function registerTemplate(template: ApprovalTemplate): void {
  templates.set(template.triggerType, template)
}

export class ApprovalTemplates {
  getTemplate(triggerType: ApprovalTriggerType): ApprovalTemplate | undefined {
    return getTemplate(triggerType)
  }

  listTemplates(): ApprovalTemplate[] {
    return listTemplates()
  }

  registerTemplate(template: ApprovalTemplate): void {
    registerTemplate(template)
  }
}
