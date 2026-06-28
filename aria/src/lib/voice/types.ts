export type VoiceProviderName = 'browser'

export interface SpeakOptions {
  rate?: number
  pitch?: number
  voiceName?: string
}

export interface VoiceProvider {
  readonly name: VoiceProviderName
  isSupported(): boolean
  getVoices(): SpeechSynthesisVoice[]
  speak(text: string, options?: SpeakOptions): void
  stop(): void
}

export interface VoiceSettings {
  voiceRepliesEnabled: boolean
  voiceProvider: VoiceProviderName
  browserVoiceName: string
  speechRate: number
  speechPitch: number
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voiceRepliesEnabled: false,
  voiceProvider: 'browser',
  browserVoiceName: '',
  speechRate: 1,
  speechPitch: 1,
}
