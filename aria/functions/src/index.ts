import * as admin from 'firebase-admin'

// Initialize Firebase Admin once
admin.initializeApp()

export { chatWithAria } from './chat'
export { transcribeAudio, synthesizeSpeech } from './voice'
export { executeAction } from './executeAction'
export { sendTestNotification } from './notifications'
export { processDueReminders } from './processDueReminders'
export { generateDailyBriefing } from './briefing'
export { getPluginStatus } from './pluginStatus'
export {
  runWorkflowFn as runWorkflow,
  getWorkflowHistoryFn as getWorkflowHistory,
  listWorkflowsFn as listWorkflows,
  getWorkflowSchedulesFn as getWorkflowSchedules,
  setWorkflowEnabledFn as setWorkflowEnabled,
} from './workflowApi'
export { runAgentGraph, getAgentStatus } from './agentApi'
export {
  buildMemoryFromContact,
  buildMemoryFromTask,
  buildMemoryFromReminder,
  buildMemoryFromChat,
  searchMemoryGraph,
  retrieveMemoryContext,
  rebuildMemoryIndex,
  validateMemoryGraph,
  getMemoryGraphStats,
  extractRelationships,
  upsertMemoryNode,
  listMemoryNodes,
} from './memoryGraphApi'
export {
  ingestDocument,
  searchDocuments,
  chatWithDocument,
  listDocuments,
  deleteDocument,
  getDocumentStats,
  createDocumentFolder,
  listDocumentFolders,
  rebuildDocumentIndex,
} from './documentApi'
export {
  getProviderHealth,
  listCommunicationProviders,
  ingestCommunicationMessage,
  sendCommunicationMessage,
  syncCommunicationProvider,
  listConversationThreads,
  getConversationMessages,
  markThreadRead,
  archiveConversationThread,
  analyzeConversationThread,
  generateConversationSummary,
  generateAIReply,
  searchCommunications,
  getCommunicationStats,
  createCommunicationTemplate,
  listCommunicationTemplates,
  scheduleCommunicationMessage,
  listScheduledMessages,
} from './communicationApi'
export {
  getHealthProviderHealth,
  listHealthProviders,
  createPatient,
  getPatient,
  listPatients,
  addPatientVisit,
  addPatientAllergy,
  addPatientMedicalHistory,
  addPatientLabResult,
  createHealthFacility,
  listHealthFacilities,
  createHealthcareProvider,
  listHealthcareProviders,
  scheduleAppointment,
  rescheduleAppointment,
  cancelAppointment,
  completeAppointment,
  setAppointmentTravelTime,
  listAppointments,
  createRecurringAppointments,
  addMedication,
  updateMedicationStatus,
  listMedications,
  scheduleMedicationDose,
  recordMedicationDose,
  setMedicationRefillDate,
  scheduleVaccination,
  markVaccinationCompleted,
  listVaccinations,
  vaccinationDueList,
  registerDisease,
  listDiseases,
  registerHealthProgram,
  listHealthPrograms,
  generateDecisionSupport,
  getHealthStats,
  runHealthReminderChecks,
  listHealthSuggestions,
  dismissHealthSuggestion,
  generateFollowUpReminder,
  linkMedicalReport,
} from './healthApi'
