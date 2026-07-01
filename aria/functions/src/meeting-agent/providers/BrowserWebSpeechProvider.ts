/**
 * BrowserWebSpeechProvider.ts — semi-functional architecture description.
 *
 * The browser's Web Speech API can ONLY be called from browser JavaScript context.
 * The backend (Cloud Functions / Node.js) has NO access to microphone hardware.
 *
 * This class describes the architecture of how a browser Web Speech API integration
 * would work, and provides a clear "browser-side-only" status for all methods.
 *
 * Real implementation requires a frontend SDK that sends transcript text
 * (NOT raw audio) to the backend Cloud Functions for storage and processing.
 */

export interface WebSpeechTranscriptResult {
  text: string
  isFinal: boolean
  confidence: number
  language: string
}

export class BrowserWebSpeechProvider {
  readonly name = 'BrowserWebSpeechAPI'

  /**
   * Architecture description: how browser Web Speech API would be used.
   *
   * In a real implementation:
   * 1. Frontend calls `new SpeechRecognition()` in browser context.
   * 2. Browser requests microphone permission via OS prompt.
   * 3. Browser streams audio to recognition engine.
   * 4. onresult callback receives transcript text.
   * 5. Frontend calls Cloud Function `addTranscriptChunk` with text only.
   * 6. Backend stores chunk to Firestore (no audio, no raw stream).
   *
   * This backend class CANNOT implement steps 1-4 — they require browser APIs.
   */
  startListening(): { success: false; browserSideOnly: true; reason: string } {
    return {
      success: false,
      browserSideOnly: true,
      reason:
        'Browser Web Speech API requires a browser JavaScript context. ' +
        'The backend cannot capture microphone audio. ' +
        'Implement SpeechRecognition in the frontend and call addTranscriptChunk to send text to the backend.',
    }
  }

  stopListening(): { success: false; browserSideOnly: true; reason: string } {
    return {
      success: false,
      browserSideOnly: true,
      reason: 'Browser Web Speech API is frontend-only. Stop listening by calling recognition.stop() in the browser.',
    }
  }

  /**
   * Supported languages by the Web Speech API (informational only).
   */
  supportedLanguages(): string[] {
    return ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'zh-CN', 'pt-BR', 'ar-SA']
  }

  /**
   * Status check — always returns browser-side-only.
   */
  getStatus(): { available: false; reason: string } {
    return {
      available: false,
      reason: 'BrowserWebSpeechProvider is a backend architecture description only. Use it from the frontend browser context.',
    }
  }
}
