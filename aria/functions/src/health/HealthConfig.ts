export interface HealthConfig {
  maxPatientsPerList: number
  maxAppointmentsPerList: number
  decisionSupportBudgetTokens: number
  entityExtractionBudgetTokens: number
  reminderLeadMinutes: number
  refillReminderLeadDays: number
  vaccinationDueWindowDays: number
  maxRetries: number
  retryDelayMs: number
}

export const DEFAULT_HEALTH_CONFIG: HealthConfig = {
  maxPatientsPerList: 100,
  maxAppointmentsPerList: 100,
  decisionSupportBudgetTokens: 1536,
  entityExtractionBudgetTokens: 1536,
  reminderLeadMinutes: 60,
  refillReminderLeadDays: 3,
  vaccinationDueWindowDays: 14,
  maxRetries: 3,
  retryDelayMs: 2000,
}
