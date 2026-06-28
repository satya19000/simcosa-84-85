import { BrowserSpeechProvider } from './BrowserSpeechProvider'
import type { VoiceProvider, VoiceProviderName, SpeakOptions } from './types'

const providers: Record<VoiceProviderName, VoiceProvider> = {
  browser: new BrowserSpeechProvider(),
}

class VoiceManager {
  private active: VoiceProvider = providers.browser

  setProvider(name: VoiceProviderName): void {
    if (providers[name]) this.active = providers[name]
  }

  getProvider(): VoiceProvider {
    return this.active
  }

  isSupported(): boolean {
    return this.active.isSupported()
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.active.getVoices()
  }

  speak(text: string, options?: SpeakOptions): void {
    if (!this.active.isSupported()) return
    this.active.speak(text, options)
  }

  stop(): void {
    this.active.stop()
  }
}

export const voiceManager = new VoiceManager()
