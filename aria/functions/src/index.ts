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
