import type { VoiceProvider, SpeakOptions } from './types'

export class BrowserSpeechProvider implements VoiceProvider {
  readonly name = 'browser' as const

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported()) return []
    return window.speechSynthesis.getVoices()
  }

  speak(text: string, options: SpeakOptions = {}): void {
    if (!this.isSupported()) return
    this.stop()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options.rate ?? 1
    utterance.pitch = options.pitch ?? 1

    if (options.voiceName) {
      const voices = this.getVoices()
      const match = voices.find((v) => v.name === options.voiceName)
      if (match) utterance.voice = match
    }

    window.speechSynthesis.speak(utterance)
  }

  stop(): void {
    if (!this.isSupported()) return
    window.speechSynthesis.cancel()
  }
}
