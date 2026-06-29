import type { AgentManifest } from '../Agent'
import type { AgentTask } from '../AgentTask'
import type { AgentResult } from '../AgentResult'
import type { AgentContext } from '../AgentContext'
import type { AgentCapability } from '../AgentTypes'
import { BaseAgent } from './BaseAgent'

class PlaceholderAgent extends BaseAgent {
  readonly manifest: AgentManifest

  constructor(id: string, name: string, description: string, capability: AgentCapability) {
    super()
    this.manifest = { id, name, description, version: '0.0.0', capabilities: [capability], placeholder: true }
  }

  canHandle(_task: AgentTask): boolean {
    return false
  }

  async execute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    return this.makeErrorResult(task, ctx, `${this.manifest.name} is not yet implemented`, Date.now())
  }
}

export const EmailAgent = new PlaceholderAgent('email-agent', 'Email Agent', 'Reads and sends emails', 'email')
export const WhatsAppAgent = new PlaceholderAgent('whatsapp-agent', 'WhatsApp Agent', 'Sends WhatsApp messages', 'whatsapp')
export const MapsAgent = new PlaceholderAgent('maps-agent', 'Maps Agent', 'Location and navigation', 'maps')
export const FinanceAgent = new PlaceholderAgent('finance-agent', 'Finance Agent', 'Financial data and budgets', 'finance')
export const HealthAgent = new PlaceholderAgent('health-agent', 'Health Agent', 'Health and fitness tracking', 'health')
export const DocumentAgent = new PlaceholderAgent('document-agent', 'Document Agent', 'Document generation and editing', 'document')
export const OCRAgent = new PlaceholderAgent('ocr-agent', 'OCR Agent', 'Optical character recognition', 'ocr')
export const AutomationAgent = new PlaceholderAgent('automation-agent', 'Automation Agent', 'Custom automations and integrations', 'automation')
