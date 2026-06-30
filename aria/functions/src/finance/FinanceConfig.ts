export interface FinanceConfig {
  maxListLimit: number
  invoiceReminderLeadDays: number
  overdueGraceDays: number
  budgetAlertThresholdPct: number
  maintenanceReminderLeadDays: number
  analyticsBudgetTokens: number
  entityExtractionBudgetTokens: number
  maxRetries: number
  retryDelayMs: number
}

export const DEFAULT_FINANCE_CONFIG: FinanceConfig = {
  maxListLimit: 100,
  invoiceReminderLeadDays: 5,
  overdueGraceDays: 0,
  budgetAlertThresholdPct: 90,
  maintenanceReminderLeadDays: 7,
  analyticsBudgetTokens: 1536,
  entityExtractionBudgetTokens: 1536,
  maxRetries: 3,
  retryDelayMs: 2000,
}
